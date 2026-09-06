# PeaceOS Verify

Open-source tooling that packages human rights evidence into **Verifiable
Evidence Packages (VEP)** and lets any third party independently verify their
integrity, timestamp, chain of custody and organizational provenance —
without trusting Blue Human or any server.

This repository covers **Phase 1** of PeaceOS. See [AGENTS.md](./AGENTS.md)
for the mission constraints and scope, and [docs/spec-source.md](./docs/spec-source.md)
for the full specification.

## Status

- **M0 — Scaffolding and schema:** done. `spec/manifest.schema.json` is the
  source of truth for the VEP manifest format (v0.1); the exact bytes that
  get canonicalized, hashed, signed and timestamped are pinned in
  `spec/CRYPTO_CONTRACT.md`.
- **M1 — Verification core + CLI:** done. `@peaceos/core` implements
  `build`/`verify`; `@peaceos/cli` (`peaceos-verify`) wraps it with
  `keygen`/`create`/`check`. See [`cli/README.md`](./cli/README.md) for
  usage and [`examples/README.md`](./examples/README.md) for ready-to-run
  valid and tampered `.vep` packages.
- **M2 — Custody and redaction:** not started.

## Layout

```
spec/        VEP format spec + JSON Schema (source of truth)
core/        TypeScript library: hashing, signing, timestamping, build + verify
cli/         Node CLI wrapping core (create, check)
web/         React + MUI Verify portal (browser)
desktop/     Tauri shell around web/ for Windows/macOS/Linux — not in Phase 1's
             original documented scope (see AGENTS.md); added on top of it,
             reusing the same web/core verification code unchanged.
examples/    sample .vep packages + test vectors (valid and tampered)
docs/        user + developer docs
```

## Development

```
git submodule update --init transparency/registry
pnpm install
pnpm test
```

Requires Node 20+ and pnpm. `transparency/registry` is a git submodule
pinned to a snapshot of the public organizations registry
(`Blue-Human/peaceos_organizations`); the web portal embeds it at build
time — see [`web/README.md`](./web/README.md) for details.

`pnpm build` / `pnpm test` / `pnpm typecheck` cover `spec`, `core`, `cli`,
`examples` and `web` only — plain Node/pnpm, no extra prerequisites.
`desktop/` is deliberately excluded from those: it needs a Rust toolchain
and a platform C toolchain (see [`desktop/README.md`](./desktop/README.md)),
which most contributors won't have installed. Build/test it explicitly with
`pnpm --filter @peaceos/desktop run build`, or via its own CI job
(`.github/workflows/desktop-build.yml`).
