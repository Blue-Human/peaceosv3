# PeaceOS Verify Web

Client-side verification portal for `.vep` directories.

```bash
git submodule update --init transparency/registry   # first time only, see below
pnpm --filter @peaceos/web dev
pnpm --filter @peaceos/web build
```

Verification runs in the browser from uploaded directories. Packages are not uploaded to a server.

## The embedded transparency registry

The portal ships with a built-in copy of the public organizations registry
(`Blue-Human/peaceos_organizations`), so a verifier only has to upload the
`.vep` package — no separate transparency-folder upload is required for the
common case. Uploading a personal copy of the registry remains available as
an advanced option, and always takes precedence over the embedded one for
that verification.

**How it works:**

- [`transparency/registry`](../transparency/registry) (repo root) is a git
  submodule pointing at `Blue-Human/peaceos_organizations`, pinned to a
  specific commit — a snapshot, not a live link.
- `pnpm dev` / `pnpm build` / `pnpm test` all run
  [`scripts/build-embedded-registry.mjs`](./scripts/build-embedded-registry.mjs)
  first. It copies **only** what `core`'s `org_identity` check reads —
  `keys/<org_id>/<key_id>.pub` — into a generated module
  (`src/embeddedRegistry.generated.ts`, gitignored, regenerated every run).
  Nothing else from the registry (manifest, timestamps, docs) is embedded.
- That generated module is imported like any other source file, so Vite
  inlines the key bytes straight into the JS bundle at build time. At
  runtime, `src/embeddedTransparency.ts` decodes them in memory — there is
  no `fetch`/`XHR` involved, so this never touches the network, even for the
  "embedded" path.
- The portal shows which snapshot is embedded (commit + date) next to the
  advanced-option toggle, so a verifier can tell which registry state a
  given build corresponds to.
- This is only a mechanism for *packaging* the registry into the portal —
  it does not change what `core` checks or how `org_identity` is resolved.

**Updating the embedded registry when the registry changes:**

```bash
git submodule update --remote transparency/registry   # pulls the latest registry commit
git add transparency/registry
git commit -m "chore: update embedded transparency registry"
git push
```

Then rebuild and redeploy the portal (`pnpm --filter @peaceos/web build`,
then publish `web/dist` through your usual static hosting) so the new
snapshot actually ships. See
[`.github/workflows/web-build.yml`](../.github/workflows/web-build.yml) for
a build-only CI job (no deploy credentials) that exercises this same path —
wire your deploy step onto its output when you have one.

## Bringing your own transparency copy

For maximum assurance, a verifier can still load a local checkout of the
transparency registry manually (the "advanced option" in the UI). Whatever
folder they load there is used instead of the embedded one for that
verification — it is never merged with or falls back to the embedded copy.
