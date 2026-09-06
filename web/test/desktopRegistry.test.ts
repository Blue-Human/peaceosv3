import { describe, expect, it } from 'vitest';

import { describeUpdateError, isDesktop, isRegistryStale, STALE_THRESHOLD_DAYS } from '../src/desktopRegistry.js';

describe('isDesktop', () => {
  it('is false under plain vitest/Node — there is no Tauri backend here', () => {
    expect(isDesktop()).toBe(false);
  });
});

describe('isRegistryStale', () => {
  it('is not stale for a date within the threshold', () => {
    const recent = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    expect(isRegistryStale(recent)).toBe(false);
  });

  it('is stale for a date older than the default threshold', () => {
    const old = new Date(Date.now() - (STALE_THRESHOLD_DAYS + 1) * 24 * 60 * 60 * 1000).toISOString();
    expect(isRegistryStale(old)).toBe(true);
  });

  it('respects a custom threshold', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    expect(isRegistryStale(eightDaysAgo, 7)).toBe(true);
    expect(isRegistryStale(eightDaysAgo, 30)).toBe(false);
  });

  it('never reports stale for an unparseable date, rather than throwing', () => {
    expect(isRegistryStale('not-a-date')).toBe(false);
  });
});

describe('describeUpdateError', () => {
  it('passes a plain string through as-is', () => {
    expect(describeUpdateError('boom')).toBe('boom');
  });

  it('extracts the message from an Error', () => {
    expect(describeUpdateError(new Error('boom'))).toBe('boom');
  });

  it('stringifies anything else', () => {
    expect(describeUpdateError({ weird: true })).toBe('[object Object]');
  });
});
