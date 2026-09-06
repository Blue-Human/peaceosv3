//! Phase B: the "update organizations" action — the ONLY code path in this
//! app that touches the network, and only when the user explicitly invokes
//! it from the UI. The source is fixed here in code (never a URL supplied
//! by the frontend): the canonical `Blue-Human/peaceos_organizations`
//! repository, over HTTPS.
//!
//! This module does not verify evidence and does not touch `core`'s
//! verification logic. It only prepares a local transparency snapshot
//! (`keys/<org_id>/<key_id>.pub` + `registry.manifest`) for the SAME
//! resolution logic the web portal already uses to read — see
//! web/src/embeddedTransparency.ts for the browser-side equivalent.
//!
//! Fetch -> validate -> persist, strictly in that order. Any validation
//! failure aborts before anything is written, so the previously-stored
//! local copy (if any) is never touched by a bad download (fail closed).

use std::collections::BTreeMap;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tauri::Manager;

const REGISTRY_OWNER: &str = "Blue-Human";
const REGISTRY_REPO: &str = "peaceos_organizations";
const REGISTRY_REF: &str = "main";
const MANIFEST_PATH: &str = "registry.manifest";
const USER_AGENT: &str = concat!("peaceos-verify-desktop/", env!("CARGO_PKG_VERSION"));

const API_BASE: &str = "https://api.github.com";
const RAW_BASE: &str = "https://raw.githubusercontent.com";

// ---------------------------------------------------------------------------
// Path / slug rules — mirrors transparency/registry/scripts/lib.mjs
// (SLUG_RE, parseKeyPath), which is itself stricter than core's minimal
// path-traversal guard on purpose: a public registry earns hygiene by being
// more restrictive than the bare minimum core requires.
// ---------------------------------------------------------------------------

fn is_valid_slug(s: &str) -> bool {
    let mut chars = s.chars();
    let Some(first) = chars.next() else { return false };
    if !(first.is_ascii_lowercase() || first.is_ascii_digit()) {
        return false;
    }
    chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

/// Parses `keys/<org_id>/<key_id>.pub` into (org_id, key_id); rejects
/// anything else, including any path containing `.`, `..`, or characters
/// outside the slug alphabet — so a downstream `dir.join(path)` can never
/// escape the target directory.
fn parse_key_path(path: &str) -> Option<(String, String)> {
    let rest = path.strip_prefix("keys/")?;
    let (org_id, rest) = rest.split_once('/')?;
    let key_id = rest.strip_suffix(".pub")?;
    if key_id.is_empty() || !is_valid_slug(org_id) || !is_valid_slug(key_id) {
        return None;
    }
    Some((org_id.to_string(), key_id.to_string()))
}

// ---------------------------------------------------------------------------
// Private-material scan — mirrors scanForSecrets() in
// transparency/registry/scripts/lib.mjs (the registry's own guard against
// committing secret material), applied here to whatever we downloaded,
// independent of whether the upstream repo's own CI already checked it.
// ---------------------------------------------------------------------------

fn looks_like_mnemonic_line(line: &str) -> bool {
    let words: Vec<&str> = line.split_ascii_whitespace().collect();
    if words.len() < 12 {
        return false;
    }
    words
        .iter()
        .all(|w| (3..=8).contains(&w.len()) && w.bytes().all(|b| b.is_ascii_lowercase()))
}

fn scan_for_secrets(bytes: &[u8]) -> Result<(), String> {
    // A raw Ed25519 secret key from libsodium is exactly 64 opaque binary
    // bytes. Redundant with the 32-byte check callers already apply to key
    // files, but kept here (and applied to the manifest too) as an explicit,
    // independent invariant.
    let is_printable = bytes
        .iter()
        .all(|&b| matches!(b, 9 | 10 | 13) || (32..127).contains(&b));
    if bytes.len() == 64 && !is_printable {
        return Err("file is exactly 64 opaque binary bytes — the size of a raw Ed25519 secret key".to_string());
    }

    let text = String::from_utf8_lossy(bytes);
    if text.contains("-----BEGIN") && text.contains("PRIVATE KEY-----") {
        return Err("contains a PEM \"BEGIN ... PRIVATE KEY\" banner".to_string());
    }
    for line in text.lines() {
        if looks_like_mnemonic_line(line.trim()) {
            return Err("contains a line that looks like a BIP39 seed phrase".to_string());
        }
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// registry.manifest — mirrors build-manifest.mjs's output format exactly:
// "<org_id>/<key_id> <sha256-hex>[ example]", sorted, comments start with #.
// ---------------------------------------------------------------------------

fn sha256_hex(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    hasher.finalize().iter().map(|b| format!("{b:02x}")).collect()
}

fn parse_manifest(bytes: &[u8]) -> Result<BTreeMap<String, String>, String> {
    let text = std::str::from_utf8(bytes).map_err(|_| format!("{MANIFEST_PATH} is not valid UTF-8"))?;
    let mut map = BTreeMap::new();
    for raw_line in text.lines() {
        let line = raw_line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let mut parts = line.split(' ');
        let reference = parts
            .next()
            .filter(|s| !s.is_empty())
            .ok_or_else(|| format!("{MANIFEST_PATH}: malformed line: {raw_line:?}"))?;
        let hash = parts
            .next()
            .ok_or_else(|| format!("{MANIFEST_PATH}: malformed line: {raw_line:?}"))?;
        if hash.len() != 64 || !hash.bytes().all(|b| b.is_ascii_hexdigit()) {
            return Err(format!("{MANIFEST_PATH}: not a sha256 hex digest on line: {raw_line:?}"));
        }
        map.insert(reference.to_string(), hash.to_ascii_lowercase());
    }
    Ok(map)
}

// ---------------------------------------------------------------------------
// Validation — fail closed: any error here means the download is discarded
// and the previously-stored local copy (if any) is left exactly as it was.
// ---------------------------------------------------------------------------

fn validate_snapshot(keys: &[(String, Vec<u8>)], manifest_bytes: &[u8]) -> Result<(), String> {
    scan_for_secrets(manifest_bytes).map_err(|reason| format!("{MANIFEST_PATH}: {reason}"))?;

    if keys.is_empty() {
        return Err("no organizational keys were found in the download".to_string());
    }

    let mut by_ref: BTreeMap<String, &[u8]> = BTreeMap::new();
    for (path, bytes) in keys {
        let (org_id, key_id) =
            parse_key_path(path).ok_or_else(|| format!("unexpected entry (not keys/<org_id>/<key_id>.pub): {path}"))?;
        if bytes.len() != 32 {
            return Err(format!(
                "{path} is {} bytes — a raw Ed25519 public key is exactly 32 bytes",
                bytes.len()
            ));
        }
        if bytes.iter().all(|&b| b == 0) {
            return Err(format!("{path} is 32 zero bytes — not a real key"));
        }
        scan_for_secrets(bytes).map_err(|reason| format!("{path}: {reason}"))?;
        by_ref.insert(format!("{org_id}/{key_id}"), bytes.as_slice());
    }

    let manifest = parse_manifest(manifest_bytes)?;

    for (reference, bytes) in &by_ref {
        let expected_hash = manifest
            .get(reference)
            .ok_or_else(|| format!("keys/{reference}.pub was downloaded but {MANIFEST_PATH} has no entry for it"))?;
        let actual_hash = sha256_hex(bytes);
        if &actual_hash != expected_hash {
            return Err(format!(
                "{MANIFEST_PATH} hash for {reference} does not match the downloaded key (expected {expected_hash}, got {actual_hash})"
            ));
        }
    }
    for reference in manifest.keys() {
        if !by_ref.contains_key(reference) {
            return Err(format!(
                "{MANIFEST_PATH} lists {reference} but keys/{reference}.pub was not found in the download"
            ));
        }
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Minimal base64 (RFC 4648, standard alphabet, with padding) — encode only.
// Used solely to hand key bytes to the frontend over Tauri's JSON-based IPC,
// the same encoding web/src/embeddedTransparency.ts decodes with `atob`.
// This is an encoding, not a cryptographic primitive, so hand-rolling it
// (with the test vectors below) is in scope; see AGENTS.md re: not
// hand-rolling *crypto*.
// ---------------------------------------------------------------------------

const BASE64_ALPHABET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

fn base64_encode(bytes: &[u8]) -> String {
    let mut out = String::with_capacity(bytes.len().div_ceil(3) * 4);
    for chunk in bytes.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = *chunk.get(1).unwrap_or(&0) as u32;
        let b2 = *chunk.get(2).unwrap_or(&0) as u32;
        let n = (b0 << 16) | (b1 << 8) | b2;
        out.push(BASE64_ALPHABET[((n >> 18) & 0x3f) as usize] as char);
        out.push(BASE64_ALPHABET[((n >> 12) & 0x3f) as usize] as char);
        out.push(if chunk.len() > 1 {
            BASE64_ALPHABET[((n >> 6) & 0x3f) as usize] as char
        } else {
            '='
        });
        out.push(if chunk.len() > 2 {
            BASE64_ALPHABET[(n & 0x3f) as usize] as char
        } else {
            '='
        });
    }
    out
}

// ---------------------------------------------------------------------------
// Fetching — the only network I/O in this whole application.
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
struct CommitResponse {
    sha: String,
    commit: CommitDetail,
}
#[derive(Deserialize)]
struct CommitDetail {
    committer: CommitterDetail,
}
#[derive(Deserialize)]
struct CommitterDetail {
    date: String,
}

#[derive(Deserialize)]
struct TreeResponse {
    tree: Vec<TreeEntry>,
    truncated: bool,
}
#[derive(Deserialize)]
struct TreeEntry {
    path: String,
    #[serde(rename = "type")]
    entry_type: String,
}

fn agent() -> ureq::Agent {
    ureq::AgentBuilder::new()
        .timeout(std::time::Duration::from_secs(20))
        .build()
}

fn fetch_commit_info(agent: &ureq::Agent) -> Result<(String, String), String> {
    let url = format!("{API_BASE}/repos/{REGISTRY_OWNER}/{REGISTRY_REPO}/commits/{REGISTRY_REF}");
    let response = agent
        .get(&url)
        .set("User-Agent", USER_AGENT)
        .set("Accept", "application/vnd.github+json")
        .call()
        .map_err(|e| format!("could not reach the organizations registry: {e}"))?;
    let parsed: CommitResponse = response
        .into_json()
        .map_err(|e| format!("unexpected response resolving the latest registry commit: {e}"))?;
    Ok((parsed.sha, parsed.commit.committer.date))
}

fn fetch_tree(agent: &ureq::Agent, commit_sha: &str) -> Result<Vec<String>, String> {
    let url = format!("{API_BASE}/repos/{REGISTRY_OWNER}/{REGISTRY_REPO}/git/trees/{commit_sha}?recursive=1");
    let response = agent
        .get(&url)
        .set("User-Agent", USER_AGENT)
        .set("Accept", "application/vnd.github+json")
        .call()
        .map_err(|e| format!("could not list the organizations registry contents: {e}"))?;
    let parsed: TreeResponse = response
        .into_json()
        .map_err(|e| format!("unexpected response listing the registry contents: {e}"))?;

    if parsed.truncated {
        return Err("the registry listing was truncated by GitHub's API — refusing to apply a partial view".to_string());
    }

    Ok(parsed
        .tree
        .into_iter()
        .filter(|entry| entry.entry_type == "blob")
        .map(|entry| entry.path)
        .collect())
}

fn fetch_raw(agent: &ureq::Agent, commit_sha: &str, path: &str) -> Result<Vec<u8>, String> {
    let url = format!("{RAW_BASE}/{REGISTRY_OWNER}/{REGISTRY_REPO}/{commit_sha}/{path}");
    let response = agent
        .get(&url)
        .set("User-Agent", USER_AGENT)
        .call()
        .map_err(|e| format!("could not download {path}: {e}"))?;
    let mut buf = Vec::new();
    response
        .into_reader()
        .read_to_end(&mut buf)
        .map_err(|e| format!("could not read {path}: {e}"))?;
    Ok(buf)
}

type DownloadedSnapshot = (String, String, Vec<(String, Vec<u8>)>, Vec<u8>);

/// Downloads ONLY `keys/<org_id>/<key_id>.pub` and `registry.manifest` from
/// the fixed canonical source. Returns (commit, date, keys, manifest_bytes),
/// unvalidated — see `validate_snapshot`.
fn download_registry_snapshot() -> Result<DownloadedSnapshot, String> {
    let agent = agent();

    let (commit, date) = fetch_commit_info(&agent)?;
    let all_paths = fetch_tree(&agent, &commit)?;

    let key_paths: Vec<String> = all_paths.iter().filter(|p| parse_key_path(p).is_some()).cloned().collect();
    if !all_paths.iter().any(|p| p == MANIFEST_PATH) {
        return Err(format!("{MANIFEST_PATH} not found in the registry — refusing to update without it"));
    }
    if key_paths.is_empty() {
        return Err("no organizational keys found in the registry".to_string());
    }

    let mut keys = Vec::with_capacity(key_paths.len());
    for path in &key_paths {
        let bytes = fetch_raw(&agent, &commit, path)?;
        keys.push((path.clone(), bytes));
    }
    let manifest_bytes = fetch_raw(&agent, &commit, MANIFEST_PATH)?;

    Ok((commit, date, keys, manifest_bytes))
}

// ---------------------------------------------------------------------------
// Persistence — plain Path-based (no Tauri context) so it's directly
// unit-testable; `registry_dir` is the only part that needs an AppHandle.
// ---------------------------------------------------------------------------

fn registry_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|dir| dir.join("organizations-registry"))
        .map_err(|e| format!("could not resolve the app data directory: {e}"))
}

fn write_snapshot_to(dir: &Path, keys: &[(String, Vec<u8>)], manifest_bytes: &[u8], commit: &str, date: &str) -> Result<(), String> {
    fs::create_dir_all(dir).map_err(|e| format!("could not create {}: {e}", dir.display()))?;
    for (path, bytes) in keys {
        let full = dir.join(path); // `path` is already keys/<slug>/<slug>.pub — no traversal possible.
        if let Some(parent) = full.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("could not create {}: {e}", parent.display()))?;
        }
        fs::write(&full, bytes).map_err(|e| format!("could not write {}: {e}", full.display()))?;
    }
    fs::write(dir.join(MANIFEST_PATH), manifest_bytes).map_err(|e| format!("could not write {MANIFEST_PATH}: {e}"))?;

    let version = serde_json::json!({ "commit": commit, "date": date });
    let version_bytes = serde_json::to_vec_pretty(&version).map_err(|e| format!("could not encode version.json: {e}"))?;
    fs::write(dir.join("version.json"), version_bytes).map_err(|e| format!("could not write version.json: {e}"))?;
    Ok(())
}

/// Writes the new snapshot to a staging directory, then swaps it into place.
/// If the final rename fails, the previous copy (if any) is restored — the
/// active registry is never left missing or half-written.
fn persist_snapshot(final_dir: &Path, keys: &[(String, Vec<u8>)], manifest_bytes: &[u8], commit: &str, date: &str) -> Result<(), String> {
    let parent = final_dir
        .parent()
        .ok_or_else(|| "invalid registry storage path".to_string())?;
    fs::create_dir_all(parent).map_err(|e| format!("could not create {}: {e}", parent.display()))?;

    let staging_dir = parent.join("organizations-registry.new");
    let backup_dir = parent.join("organizations-registry.bak");
    let _ = fs::remove_dir_all(&staging_dir);
    let _ = fs::remove_dir_all(&backup_dir);

    write_snapshot_to(&staging_dir, keys, manifest_bytes, commit, date)?;

    if final_dir.exists() {
        fs::rename(final_dir, &backup_dir).map_err(|e| format!("could not move aside the previous registry copy: {e}"))?;
    }
    if let Err(e) = fs::rename(&staging_dir, final_dir) {
        if backup_dir.exists() {
            let _ = fs::rename(&backup_dir, final_dir);
        }
        return Err(format!("could not activate the downloaded registry: {e}"));
    }
    let _ = fs::remove_dir_all(&backup_dir);
    Ok(())
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LocalRegistrySnapshot {
    pub files: BTreeMap<String, String>,
    pub commit: String,
    pub date: String,
}

#[derive(Deserialize)]
struct VersionFile {
    commit: String,
    date: String,
}

fn collect_pub_files(registry_root: &Path, current: &Path, out: &mut BTreeMap<String, String>) -> Result<(), String> {
    let entries = fs::read_dir(current).map_err(|e| format!("could not read {}: {e}", current.display()))?;
    for entry in entries {
        let entry = entry.map_err(|e| format!("could not read a directory entry: {e}"))?;
        let path = entry.path();
        if path.is_dir() {
            collect_pub_files(registry_root, &path, out)?;
        } else if path.extension().and_then(|ext| ext.to_str()) == Some("pub") {
            let bytes = fs::read(&path).map_err(|e| format!("could not read {}: {e}", path.display()))?;
            let rel = path
                .strip_prefix(registry_root)
                .map_err(|_| "internal path error while reading the local registry".to_string())?
                .to_string_lossy()
                .replace('\\', "/");
            out.insert(rel, base64_encode(&bytes));
        }
    }
    Ok(())
}

/// Reads whatever is currently persisted at `dir`, if anything. `Ok(None)`
/// means no local update has ever been applied (fall back to embedded);
/// `Err` means something is on disk but unreadable/corrupt — the caller
/// falls back to embedded too, but can surface a warning.
fn read_local_snapshot(dir: &Path) -> Result<Option<LocalRegistrySnapshot>, String> {
    if !dir.exists() {
        return Ok(None);
    }
    let version_bytes =
        fs::read(dir.join("version.json")).map_err(|e| format!("locally updated registry's version.json is unreadable: {e}"))?;
    let version: VersionFile =
        serde_json::from_slice(&version_bytes).map_err(|e| format!("locally updated registry's version.json is corrupt: {e}"))?;

    let mut files = BTreeMap::new();
    let keys_dir = dir.join("keys");
    if keys_dir.exists() {
        collect_pub_files(dir, &keys_dir, &mut files)?;
    }
    if files.is_empty() {
        return Err("locally updated registry has no key files".to_string());
    }

    Ok(Some(LocalRegistrySnapshot {
        files,
        commit: version.commit,
        date: version.date,
    }))
}

// ---------------------------------------------------------------------------
// Tauri commands — the only two ways the frontend can reach this module.
// Tauri runs commands off the main thread by default, so this plain
// synchronous network + disk I/O never blocks the UI.
// ---------------------------------------------------------------------------

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistryUpdateOutcome {
    pub commit: String,
    pub date: String,
    pub key_count: usize,
}

#[tauri::command]
pub fn update_organizations_registry(app: tauri::AppHandle) -> Result<RegistryUpdateOutcome, String> {
    let dir = registry_dir(&app)?;
    let (commit, date, keys, manifest_bytes) = download_registry_snapshot()?;
    validate_snapshot(&keys, &manifest_bytes)?;
    let key_count = keys.len();
    persist_snapshot(&dir, &keys, &manifest_bytes, &commit, &date)?;
    Ok(RegistryUpdateOutcome { commit, date, key_count })
}

#[tauri::command]
pub fn load_local_registry_state(app: tauri::AppHandle) -> Result<Option<LocalRegistrySnapshot>, String> {
    let dir = registry_dir(&app)?;
    read_local_snapshot(&dir)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A fresh, unique directory for this test to use as `final_dir`'s
    /// *parent*. `persist_snapshot` derives its staging/backup sibling paths
    /// (hard-coded names) from that parent, so tests that ran in parallel
    /// against a shared parent (e.g. the bare system temp dir) would race on
    /// those siblings — hence a whole unique root per test, not just a
    /// unique leaf name.
    fn unique_registry_dir(label: &str) -> PathBuf {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir()
            .join(format!("peaceos-verify-desktop-test-{label}-{}-{nanos}", std::process::id()))
            .join("organizations-registry")
    }

    // ---- slug / path parsing ----

    #[test]
    fn accepts_well_formed_key_paths() {
        assert_eq!(
            parse_key_path("keys/org-recolectora/org-2026.pub"),
            Some(("org-recolectora".to_string(), "org-2026".to_string()))
        );
    }

    #[test]
    fn rejects_malformed_or_unsafe_key_paths() {
        for bad in [
            "keys/org/key.txt",           // wrong extension
            "keys/org/sub/key.pub",       // too many segments
            "keys/Org/key.pub",           // uppercase not in slug alphabet
            "keys/../etc/passwd.pub",     // traversal — also fails the slug check
            "keys//key.pub",              // empty org_id
            "keys/org/.pub",              // empty key_id
            "orgs/org/metadata.json",     // not under keys/ at all
            "keys/org/key.pub.pub",       // "." is outside the slug alphabet
        ] {
            assert!(parse_key_path(bad).is_none(), "expected {bad:?} to be rejected");
        }
    }

    #[test]
    fn base64_matches_rfc4648_test_vectors() {
        let cases: &[(&[u8], &str)] = &[
            (b"", ""),
            (b"f", "Zg=="),
            (b"fo", "Zm8="),
            (b"foo", "Zm9v"),
            (b"foob", "Zm9vYg=="),
            (b"fooba", "Zm9vYmE="),
            (b"foobar", "Zm9vYmFy"),
        ];
        for (input, expected) in cases {
            assert_eq!(base64_encode(input), *expected, "input {input:?}");
        }
    }

    // ---- secret scanning ----

    #[test]
    fn a_plausible_32_byte_key_passes_the_secret_scan() {
        let bytes: Vec<u8> = (0..32).collect();
        assert!(scan_for_secrets(&bytes).is_ok());
    }

    #[test]
    fn rejects_pem_private_key_banner() {
        let text = b"-----BEGIN OPENSSH PRIVATE KEY-----\nAAAA\n-----END OPENSSH PRIVATE KEY-----\n";
        assert!(scan_for_secrets(text).is_err());
    }

    #[test]
    fn rejects_64_opaque_bytes_shaped_like_a_secret_key() {
        let bytes: Vec<u8> = (0..64u16).map(|n| (n % 256) as u8).collect();
        assert!(scan_for_secrets(&bytes).is_err());
    }

    #[test]
    fn rejects_bip39_looking_mnemonic_lines() {
        let text = "abandon ability able about above absent absorb abstract absurd abuse access accident\n";
        assert!(scan_for_secrets(text.as_bytes()).is_err());
    }

    // ---- manifest parsing ----

    #[test]
    fn parses_a_well_formed_manifest() {
        let text = b"# comment\norg-recolectora/org-2026 e3a835b50910454e9c2efe80d7e0bf47a99efa547bf331f68e170085e6ae3cde example\n";
        let map = parse_manifest(text).unwrap();
        assert_eq!(
            map.get("org-recolectora/org-2026").map(String::as_str),
            Some("e3a835b50910454e9c2efe80d7e0bf47a99efa547bf331f68e170085e6ae3cde")
        );
    }

    #[test]
    fn rejects_manifest_with_bad_hash_length() {
        let text = b"org/key deadbeef\n";
        assert!(parse_manifest(text).is_err());
    }

    // ---- full validation (the "tampered registry is rejected" tests) ----

    fn valid_key_and_manifest() -> ((String, Vec<u8>), Vec<u8>) {
        let bytes: Vec<u8> = (1..=32).collect(); // not all-zero, exactly 32 bytes
        let hash = sha256_hex(&bytes);
        let manifest = format!("org-test/key-test {hash}\n").into_bytes();
        (("keys/org-test/key-test.pub".to_string(), bytes), manifest)
    }

    #[test]
    fn accepts_a_consistent_snapshot() {
        let (key, manifest) = valid_key_and_manifest();
        assert!(validate_snapshot(&[key], &manifest).is_ok());
    }

    #[test]
    fn rejects_key_with_wrong_size() {
        let (_, manifest) = valid_key_and_manifest();
        let bad_key = ("keys/org-test/key-test.pub".to_string(), vec![1u8; 31]);
        assert!(validate_snapshot(&[bad_key], &manifest).is_err());
    }

    #[test]
    fn rejects_all_zero_key() {
        let (_, manifest) = valid_key_and_manifest();
        let bad_key = ("keys/org-test/key-test.pub".to_string(), vec![0u8; 32]);
        assert!(validate_snapshot(&[bad_key], &manifest).is_err());
    }

    #[test]
    fn rejects_key_not_listed_in_manifest() {
        let (key, _) = valid_key_and_manifest();
        let unrelated_manifest = b"other-org/other-key 0000000000000000000000000000000000000000000000000000000000000000\n";
        assert!(validate_snapshot(&[key], unrelated_manifest).is_err());
    }

    #[test]
    fn rejects_manifest_hash_mismatch() {
        let (key, _) = valid_key_and_manifest();
        let wrong_manifest = b"org-test/key-test 0000000000000000000000000000000000000000000000000000000000000000\n";
        assert!(validate_snapshot(&[key], wrong_manifest).is_err());
    }

    #[test]
    fn rejects_manifest_referencing_a_key_that_was_not_downloaded() {
        let (key, _) = valid_key_and_manifest();
        let hash = sha256_hex(&key.1);
        let manifest_with_extra_entry = format!(
            "org-test/key-test {hash}\nghost-org/ghost-key 1111111111111111111111111111111111111111111111111111111111111111\n"
        )
        .into_bytes();
        assert!(validate_snapshot(&[key], &manifest_with_extra_entry).is_err());
    }

    #[test]
    fn rejects_a_pem_private_key_smuggled_as_a_pub_file() {
        // Not 32 bytes, so this is already caught by the size check — but we
        // assert on the failure happening at all (fail closed), not on which
        // specific check catches it.
        let pem = b"-----BEGIN PRIVATE KEY-----\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\n-----END PRIVATE KEY-----\n".to_vec();
        let manifest = format!("org-test/key-test {}\n", sha256_hex(&pem)).into_bytes();
        let key = ("keys/org-test/key-test.pub".to_string(), pem);
        assert!(validate_snapshot(&[key], &manifest).is_err());
    }

    #[test]
    fn rejects_unexpected_paths_under_keys() {
        let (_, manifest) = valid_key_and_manifest();
        let bad = ("keys/org-test/README.md".to_string(), vec![1u8; 32]);
        assert!(validate_snapshot(&[bad], &manifest).is_err());
    }

    // ---- persistence round-trip (pure Path-based, no Tauri context needed) ----

    #[test]
    fn persists_and_reloads_a_valid_snapshot() {
        let dir = unique_registry_dir("persist-ok");
        let (key, manifest) = valid_key_and_manifest();

        persist_snapshot(&dir, &[key.clone()], &manifest, "abc1234", "2026-01-01T00:00:00Z").unwrap();

        let loaded = read_local_snapshot(&dir).unwrap().expect("expected a snapshot");
        assert_eq!(loaded.commit, "abc1234");
        assert_eq!(loaded.date, "2026-01-01T00:00:00Z");
        assert_eq!(loaded.files.get("keys/org-test/key-test.pub").map(String::as_str), Some(base64_encode(&key.1).as_str()));

        let _ = fs::remove_dir_all(dir.parent().unwrap());
    }

    #[test]
    fn missing_local_registry_yields_none_not_an_error() {
        let dir = unique_registry_dir("persist-missing");
        assert!(read_local_snapshot(&dir).unwrap().is_none());
    }

    #[test]
    fn a_failed_update_never_touches_the_previously_persisted_copy() {
        let dir = unique_registry_dir("persist-fail-closed");
        let (good_key, good_manifest) = valid_key_and_manifest();
        persist_snapshot(&dir, &[good_key.clone()], &good_manifest, "good-commit", "2026-01-01T00:00:00Z").unwrap();

        // Simulate what the command does: validate BEFORE persisting. A
        // tampered snapshot must never reach persist_snapshot at all.
        let tampered_key = ("keys/org-test/key-test.pub".to_string(), vec![0u8; 32]);
        let validation = validate_snapshot(&[tampered_key], &good_manifest);
        assert!(validation.is_err());

        // The directory must still reflect the last GOOD update.
        let loaded = read_local_snapshot(&dir).unwrap().expect("expected the previous snapshot to survive");
        assert_eq!(loaded.commit, "good-commit");

        let _ = fs::remove_dir_all(dir.parent().unwrap());
    }

    // ---- the real thing: against the actual canonical registry (needs network) ----

    /// GitHub Actions runners share IP ranges across countless unrelated
    /// workflows, so an unauthenticated api.github.com call here can hit a
    /// transient rate limit (HTTP 403) that has nothing to do with this
    /// code. Retried here, in the test only — the production fetch path is
    /// unchanged and still surfaces such an error immediately to the user,
    /// who can just click "Update organizations" again.
    fn download_registry_snapshot_with_retries() -> DownloadedSnapshot {
        let mut last_err = None;
        for attempt in 1..=3 {
            match download_registry_snapshot() {
                Ok(snapshot) => return snapshot,
                Err(e) => {
                    eprintln!("download_registry_snapshot attempt {attempt}/3 failed: {e}");
                    last_err = Some(e);
                    std::thread::sleep(std::time::Duration::from_secs(5 * attempt));
                }
            }
        }
        panic!(
            "could not download the real registry after 3 attempts — is there network access? last error: {}",
            last_err.unwrap()
        );
    }

    #[test]
    fn updates_from_the_real_canonical_registry() {
        let (commit, date, keys, manifest_bytes) = download_registry_snapshot_with_retries();
        assert!(!commit.is_empty());
        assert!(!date.is_empty());
        assert!(!keys.is_empty());

        validate_snapshot(&keys, &manifest_bytes).expect("the real canonical registry must validate cleanly");

        let dir = unique_registry_dir("real-registry");
        persist_snapshot(&dir, &keys, &manifest_bytes, &commit, &date).unwrap();
        let loaded = read_local_snapshot(&dir).unwrap().expect("expected a snapshot after persisting");
        assert_eq!(loaded.commit, commit);
        assert_eq!(loaded.files.len(), keys.len());

        let _ = fs::remove_dir_all(dir.parent().unwrap());
    }
}
