import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, generateEd25519Keypair } from '@peaceos/core';
import { readFileTreeFromDirectory } from '@peaceos/core/node-file-tree';
import { verifyPackageFiles } from '@peaceos/core/verify';
import type { FileTree } from '@peaceos/core/file-tree';
import { describe, expect, it } from 'vitest';

import { buildEmbeddedTransparencyTree, resolveTransparencyTree } from '../src/embeddedTransparency.js';
import { withNetworkBlocked } from '../src/networkGuard.js';

const VALID_EXAMPLE_PACKAGE = fileURLToPath(new URL('../../examples/packages/valid.vep', import.meta.url));

describe('verification against the embedded transparency registry', () => {
  it('verifies a real, valid .vep package as AUTHENTIC with no user-uploaded transparency, using only the embedded registry, and makes zero network requests', async () => {
    const packageTree = await readFileTreeFromDirectory(VALID_EXAMPLE_PACKAGE);
    const embeddedTree = buildEmbeddedTransparencyTree();

    const { result, networkAttempts } = await withNetworkBlocked(() =>
      verifyPackageFiles(packageTree, {
        packagePath: VALID_EXAMPLE_PACKAGE,
        // Same call the portal makes when the user has not loaded a custom
        // transparency copy: resolveTransparencyTree(null, embedded) === embedded.
        transparencyFiles: resolveTransparencyTree(null, embeddedTree),
      }),
    );

    expect(networkAttempts).toBe(0);
    expect(result.verdict).toBe('authentic');
    const orgIdentity = result.checks.find((check) => check.id === 'org_identity');
    expect(orgIdentity?.status).toBe('ok');
  });

  it('a user-provided transparency copy prevails over the embedded registry', async () => {
    const { packageTree, orgId, orgKeyId, orgPublicKey } = await buildPackageForUnknownOrg();
    const embeddedTree = buildEmbeddedTransparencyTree();

    // The embedded registry has no idea about this freshly-generated org: if
    // it were used (or merged in) instead of the user's copy, org_identity
    // would fail. Success here is only possible if the user's tree wins.
    const userTree: FileTree = new Map([[`keys/${orgId}/${orgKeyId}.pub`, orgPublicKey]]);
    const effectiveTree = resolveTransparencyTree(userTree, embeddedTree);
    expect(effectiveTree).toBe(userTree);

    const { result } = await withNetworkBlocked(() =>
      verifyPackageFiles(packageTree, { packagePath: '(test package)', transparencyFiles: effectiveTree }),
    );

    expect(result.verdict).toBe('authentic');

    // Control: the same package against the embedded registry alone (as if
    // the user had never uploaded a copy) cannot resolve this unknown org.
    const { result: withoutUserCopy } = await withNetworkBlocked(() =>
      verifyPackageFiles(packageTree, {
        packagePath: '(test package)',
        transparencyFiles: resolveTransparencyTree(null, embeddedTree),
      }),
    );
    const orgIdentityWithoutUserCopy = withoutUserCopy.checks.find((check) => check.id === 'org_identity');
    expect(orgIdentityWithoutUserCopy?.status).not.toBe('ok');
  });
});

async function buildPackageForUnknownOrg() {
  const workDir = await mkdtemp(join(tmpdir(), 'peaceos-web-verify-'));
  const outDir = join(workDir, 'package.vep');
  const assetSourcePath = join(workDir, 'testimonio_01.txt');
  await writeFile(assetSourcePath, 'sample evidence bytes for a web portal test\n', 'utf8');
  await mkdir(workDir, { recursive: true });

  const [fieldKeypair, orgKeypair] = await Promise.all([generateEd25519Keypair(), generateEd25519Keypair()]);
  const orgId = `org-web-test-${randomUUID().slice(0, 8)}`;
  const orgKeyId = `org-key-${randomUUID().slice(0, 8)}`;
  const fieldKeyId = `field-${randomUUID().slice(0, 8)}`;

  await build({
    outDir,
    assets: [{ sourcePath: assetSourcePath, filename: 'testimonio_01.txt', mediaType: 'text/plain' }],
    fieldKeyId,
    fieldPublicKey: fieldKeypair.publicKey,
    fieldPrivateKey: fieldKeypair.privateKey,
    orgId,
    orgKeyId,
    orgPrivateKey: orgKeypair.privateKey,
    transparencyRef: `git:keys@${'0'.repeat(40)}`,
    timestamp: { mode: 'local-pending' },
  });

  const packageTree = await readFileTreeFromDirectory(outDir);
  return { packageTree, orgId, orgKeyId, orgPublicKey: orgKeypair.publicKey };
}
