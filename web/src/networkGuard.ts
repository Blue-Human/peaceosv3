/**
 * Runs `action` with fetch/XHR disabled, counting any attempt. Used to prove
 * that browser verification (including loading the embedded transparency
 * registry) never makes a network request. Uses `globalThis` rather than
 * `window` so the same guard runs both in the browser and under plain Node
 * tests; `XMLHttpRequest` is only patched when present (browsers only).
 */
export async function withNetworkBlocked<T>(action: () => Promise<T>): Promise<{ result: T; networkAttempts: number }> {
  let networkAttempts = 0;
  const originalFetch = globalThis.fetch;
  const xhrProto = (globalThis as { XMLHttpRequest?: { prototype: XMLHttpRequest } }).XMLHttpRequest?.prototype;
  const originalOpen = xhrProto?.open;

  globalThis.fetch = (() => {
    networkAttempts += 1;
    return Promise.reject(new Error('Network requests are disabled during browser verification.'));
  }) as typeof globalThis.fetch;

  if (xhrProto) {
    xhrProto.open = function blockedOpen() {
      networkAttempts += 1;
      throw new Error('Network requests are disabled during browser verification.');
    } as XMLHttpRequest['open'];
  }

  try {
    const result = await action();
    if (networkAttempts > 0) {
      throw new Error(`Verification attempted ${networkAttempts} network request(s).`);
    }
    return { result, networkAttempts };
  } finally {
    globalThis.fetch = originalFetch;
    if (xhrProto && originalOpen) {
      xhrProto.open = originalOpen;
    }
  }
}
