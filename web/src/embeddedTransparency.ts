import type { FileTree } from '@peaceos/core/file-tree';
import {
  EMBEDDED_REGISTRY_FILES,
  EMBEDDED_REGISTRY_VERSION,
  type EmbeddedRegistryVersion,
} from './embeddedRegistry.generated.js';

export type { EmbeddedRegistryVersion };
export const embeddedRegistryVersion: EmbeddedRegistryVersion = EMBEDDED_REGISTRY_VERSION;

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

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
 * A user-provided transparency copy always prevails over the embedded
 * snapshot — it is the "bring your own copy" maximum-assurance path.
 */
export function resolveTransparencyTree(customTree: FileTree | null, embeddedTree: FileTree): FileTree {
  return customTree ?? embeddedTree;
}
