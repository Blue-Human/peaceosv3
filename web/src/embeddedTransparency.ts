import type { FileTree } from '@peaceos/core/file-tree';
import { base64ToBytes } from './base64.js';
import {
  EMBEDDED_REGISTRY_FILES,
  EMBEDDED_REGISTRY_VERSION,
  type EmbeddedRegistryVersion,
} from './embeddedRegistry.generated.js';

export type { EmbeddedRegistryVersion };
export const embeddedRegistryVersion: EmbeddedRegistryVersion = EMBEDDED_REGISTRY_VERSION;

/**
 * Builds the transparency FileTree from data bundled into the app at build
 * time (see scripts/build-embedded-registry.mjs). Purely in-memory decoding —
 * no fetch/XHR, so this never touches the network.
 */
export function buildEmbeddedTransparencyTree(): FileTree {
  const tree = new Map<string, Uint8Array>();
  for (const [ref, base64] of Object.entries(EMBEDDED_REGISTRY_FILES)) {
    tree.set(ref, base64ToBytes(base64));
  }
  return tree;
}

/**
 * Priority order: a user-provided copy (the "bring your own copy" advanced
 * option) always prevails; failing that, a locally-updated copy (desktop
 * app only, via "Update organizations" — always null in the browser
 * portal); failing that, the registry embedded at build time.
 */
export function resolveTransparencyTree(customTree: FileTree | null, updatedTree: FileTree | null, embeddedTree: FileTree): FileTree {
  return customTree ?? updatedTree ?? embeddedTree;
}
