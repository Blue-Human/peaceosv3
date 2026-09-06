// CI-only (not shipped, no dependencies of its own): writes a `<file>.sha256`
// next to every installer under a Tauri bundle directory, in the
// conventional "<hex-digest>  <filename>" format that `sha256sum -c` and
// `shasum -a 256 -c` both understand directly. Run once per OS leg of
// desktop-build.yml, after `tauri build`, before the artifact upload — so
// the checksum files ride along with the installers in both the per-PR
// artifact and the tagged-release assets.
//
// Usage: node checksum-bundles.mjs <bundle-dir>
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { readdir, writeFile } from 'node:fs/promises';

const bundleDir = process.argv[2];
if (!bundleDir) {
  console.error('Usage: node checksum-bundles.mjs <bundle-dir>');
  process.exit(1);
}

// The actual end-user-facing installer formats Tauri produces. Deliberately
// excludes intermediate/non-distributable bundle output (e.g. the raw
// macOS .app directory, which isn't a single file to check anyway — the
// .dmg wrapping it is what a user downloads and can hash).
const INSTALLER_EXTENSIONS = new Set(['.exe', '.msi', '.dmg', '.deb', '.rpm', '.appimage']);

function sha256(filePath) {
  return new Promise((resolvePromise, reject) => {
    const hash = createHash('sha256');
    createReadStream(filePath)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => resolvePromise(hash.digest('hex')))
      .on('error', reject);
  });
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    }),
  );
  return files.flat();
}

const allFiles = await walk(bundleDir);
const installers = allFiles.filter((file) => INSTALLER_EXTENSIONS.has(extname(file).toLowerCase()));

if (installers.length === 0) {
  console.error(`No installer files (${[...INSTALLER_EXTENSIONS].join(', ')}) found under ${bundleDir}`);
  process.exit(1);
}

for (const file of installers.sort()) {
  const digest = await sha256(file);
  await writeFile(`${file}.sha256`, `${digest}  ${basename(file)}\n`, 'utf8');
  console.log(`${digest}  ${file}`);
}
