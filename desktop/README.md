# PeaceOS Verify Desktop

A Tauri shell around [`@peaceos/web`](../web) for Windows, macOS and Linux.
**Phase A**: this package contains zero verification logic and zero custom
Tauri commands — it just opens a native window that shows `web/dist` exactly
as built for the browser portal, embedded transparency registry included.
Evidence verification runs entirely inside the webview, in the same
TypeScript `core`/`web` code the browser portal uses.

## Prerequisites (not needed just to read/edit this package)

Building or running the desktop shell requires the Rust toolchain and a
platform C toolchain, on top of the Node/pnpm setup the rest of the repo
uses:

- [Rust](https://www.rust-lang.org/tools/install) (stable) + Cargo.
- **Windows:** the "Desktop development with C++" workload from the Visual
  Studio Build Tools, and the [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/)
  runtime (preinstalled on most current Windows systems).
- **macOS:** Xcode Command Line Tools (`xcode-select --install`).
- **Linux:** the packages Tauri's own
  [prerequisites guide](https://v2.tauri.app/start/prerequisites/) lists for
  your distro (WebKitGTK, etc.).

None of this is required to work on `web/` or `core/` — only to build the
desktop shell itself. The `web-build` CI job in this repo does **not**
exercise this package; see `.github/workflows/desktop-build.yml` for the one
that does, running on `windows-latest` / `macos-latest` / `ubuntu-latest`
where the toolchains above are already present.

## Commands

```bash
git submodule update --init transparency/registry   # first time only
pnpm install
pnpm --filter @peaceos/desktop run dev     # opens a dev window against the Vite dev server
pnpm --filter @peaceos/desktop run build   # produces installers under desktop/src-tauri/target/release/bundle
```

`tauri dev`/`tauri build` run `web`'s own `dev`/`build` scripts first
(`build.beforeDevCommand` / `build.beforeBuildCommand` in
[`src-tauri/tauri.conf.json`](./src-tauri/tauri.conf.json)), which is what
regenerates and embeds the transparency registry snapshot — exactly as the
browser portal does. There is no separate copy of the frontend here.

## No network, enforced twice

The browser portal never calls `fetch`/`XHR` during verification (see
`web/src/networkGuard.ts` and its tests). The desktop shell additionally sets
`connect-src 'none'` in the window's Content-Security-Policy
(`app.security.csp` in `tauri.conf.json`), so the webview is structurally
unable to make any network connection at all, from any code path — not just
during verification. This is stronger than the browser case, where a user
could in principle load a different page; here there's nowhere else to
navigate to.

One consequence during development: Vite's hot-reload websocket is also
network traffic, so it's blocked by this CSP under `tauri dev`. Reload the
window manually to see changes; this is a deliberate trade-off, not a bug.

Phase B will add one explicit, user-triggered exception — an "update
organizations" action — implemented as a Rust-side Tauri command (the only
place allowed to make an HTTPS request), never as a relaxation of the
webview's own CSP.

## Capabilities

[`src-tauri/capabilities/default.json`](./src-tauri/capabilities/default.json)
grants only `core:default` (basic window functionality). No `fs`, `http`, or
`shell` plugin is registered or permitted in Phase A — there is no IPC
surface that could reach the filesystem or the network even if the CSP were
misconfigured.

## Icons

Generated once from `web/public/images/Verify_POS_logo.png` via
`pnpm exec tauri icon ../web/public/images/Verify_POS_logo.png -o src-tauri/icons`
(desktop-only sizes kept: 32×32, 128×128, 128×128@2x, `.icns`, `.ico`).
Re-run that if the logo changes.
