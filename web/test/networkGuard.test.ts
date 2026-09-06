import { describe, expect, it } from 'vitest';

import { withNetworkBlocked } from '../src/networkGuard.js';

describe('withNetworkBlocked', () => {
  it('reports zero network attempts and returns the action result when nothing calls fetch/XHR', async () => {
    const { result, networkAttempts } = await withNetworkBlocked(async () => 'ok');
    expect(result).toBe('ok');
    expect(networkAttempts).toBe(0);
  });

  it('fails the whole call if the action attempts a fetch, proving the guard actually intercepts it', async () => {
    await expect(
      withNetworkBlocked(async () => {
        await fetch('https://example.invalid/should-not-be-called');
        return 'unreachable';
      }),
    ).rejects.toThrow(/network request/i);
  });

  it('restores the original fetch after running, even when the action attempted a call', async () => {
    const originalFetch = globalThis.fetch;

    await withNetworkBlocked(async () => {
      await fetch('https://example.invalid/blocked').catch(() => undefined);
    }).catch(() => undefined);

    expect(globalThis.fetch).toBe(originalFetch);
  });
});
