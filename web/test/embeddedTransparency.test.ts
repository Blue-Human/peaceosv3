import { describe, expect, it } from 'vitest';

import { collectRegistryKeyFiles, readRegistryVersion, REGISTRY_ROOT } from '../scripts/build-embedded-registry.mjs';
import { buildEmbeddedTransparencyTree, embeddedRegistryVersion } from '../src/embeddedTransparency.js';

describe('embedded transparency registry', () => {
  it('embeds exactly the keys/<org_id>/<key_id>.pub files present in the transparency/registry submodule, byte-for-byte', async () => {
    const onDisk = await collectRegistryKeyFiles(REGISTRY_ROOT);
    expect(onDisk.length).toBeGreaterThan(0);

    const embedded = buildEmbeddedTransparencyTree();
    expect(embedded.size).toBe(onDisk.length);

    for (const { ref, bytes } of onDisk) {
      expect(embedded.has(ref)).toBe(true);
      expect(Buffer.from(embedded.get(ref)!)).toEqual(Buffer.from(bytes));
    }
  });

  it('does not embed anything outside the keys/ tree (no manifest, timestamps, or docs)', () => {
    const embedded = buildEmbeddedTransparencyTree();
    for (const ref of embedded.keys()) {
      expect(ref).toMatch(/^keys\/[^/]+\/[^/]+\.pub$/);
    }
  });

  it('reports the submodule commit and date it was built from', () => {
    const current = readRegistryVersion(REGISTRY_ROOT);
    expect(embeddedRegistryVersion).toEqual(current);
  });

  it('never touches the network to build the embedded tree', async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (() => {
      calls += 1;
      return Promise.reject(new Error('unexpected fetch during embedded registry load'));
    }) as typeof globalThis.fetch;

    try {
      buildEmbeddedTransparencyTree();
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(calls).toBe(0);
  });
});
