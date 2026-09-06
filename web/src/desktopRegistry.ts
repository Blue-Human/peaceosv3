import { invoke, isTauri } from '@tauri-apps/api/core';
import type { FileTree } from '@peaceos/core/file-tree';
import { base64ToBytes } from './base64.js';

export interface RegistryVersion {
  commit: string;
  date: string;
}

export interface RegistryUpdateOutcome extends RegistryVersion {
  keyCount: number;
}

interface LocalRegistrySnapshot {
  files: Record<string, string>;
  commit: string;
  date: string;
}

/** True only inside the Tauri desktop shell — always false in the browser portal. */
export function isDesktop(): boolean {
  return isTauri();
}

function treeFromFiles(files: Record<string, string>): FileTree {
  const tree = new Map<string, Uint8Array>();
  for (const [ref, base64] of Object.entries(files)) {
    tree.set(ref, base64ToBytes(base64));
  }
  return tree;
}

/**
 * Loads whatever the desktop app already has stored locally from a previous
 * "update organizations" run. Resolves to null both when nothing has ever
 * been downloaded and when running in the plain browser portal (there is no
 * Rust backend to ask, and no local storage of evidence/registry data
 * happens in the browser). Never touches the network — this only reads
 * local disk state the Rust side already validated when it was saved.
 */
export async function loadUpdatedRegistry(): Promise<{ tree: FileTree; version: RegistryVersion } | null> {
  if (!isDesktop()) return null;
  const snapshot = await invoke<LocalRegistrySnapshot | null>('load_local_registry_state');
  if (!snapshot) return null;
  return { tree: treeFromFiles(snapshot.files), version: { commit: snapshot.commit, date: snapshot.date } };
}

/**
 * The ONE action in this app that touches the network. Desktop-only: the
 * browser portal has no backend to do the download from, so this throws if
 * called there. Downloads, validates and persists the latest organizations
 * registry from the fixed canonical source (never a user-supplied URL); on
 * any validation failure the previous local copy is left untouched and this
 * rejects with a human-readable reason.
 */
export async function updateOrganizationsRegistry(): Promise<RegistryUpdateOutcome> {
  if (!isDesktop()) {
    throw new Error('Updating the organizations registry is only available in the desktop app.');
  }
  return invoke<RegistryUpdateOutcome>('update_organizations_registry');
}

/** Normalizes whatever shape a rejected invoke() throws into a message string. */
export function describeUpdateError(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  return String(err);
}

/** How old (in days) a registry may be before the UI suggests updating it. */
export const STALE_THRESHOLD_DAYS = 28;

/** Whether a registry dated `dateIso` is older than `thresholdDays` (default 4 weeks). */
export function isRegistryStale(dateIso: string, thresholdDays: number = STALE_THRESHOLD_DAYS): boolean {
  const registryTime = new Date(dateIso).getTime();
  if (Number.isNaN(registryTime)) return false;
  return Date.now() - registryTime > thresholdDays * 24 * 60 * 60 * 1000;
}
