/**
 * Unit tests for pure helpers (no DOM needed).
 */
import { describe, expect, it } from 'vitest';
import {
  buildSearchUrl,
  normalize,
  prettifyUrl,
  resolveHistoryTarget,
} from './utils.js';

describe('normalize', () => {
  it('trims and lowercases strings', () => {
    expect(normalize('  React Docs ')).toBe('react docs');
  });

  it('returns "" for non-strings', () => {
    expect(normalize(undefined)).toBe('');
    expect(normalize(null)).toBe('');
    expect(normalize(42)).toBe('');
  });
});

describe('buildSearchUrl', () => {
  it('builds an encoded DuckDuckGo Lite search URL', () => {
    expect(buildSearchUrl('lofi hip hop')).toBe(
      'https://lite.duckduckgo.com/lite/?q=lofi%20hip%20hop',
    );
  });

  it('returns null for blank queries', () => {
    expect(buildSearchUrl('   ')).toBeNull();
  });
});

describe('prettifyUrl', () => {
  it('strips protocol and trailing slash', () => {
    expect(prettifyUrl('https://react.dev/')).toBe('react.dev');
  });
});

describe('resolveHistoryTarget', () => {
  it('resolves plain hosts to https URLs', () => {
    expect(resolveHistoryTarget('react.dev')).toBe('https://react.dev');
  });

  it('resolves host:port entries (localhost:3000)', () => {
    expect(resolveHistoryTarget('localhost:3000')).toBe(
      'https://localhost:3000',
    );
  });

  it('resolves IP addresses with ports', () => {
    expect(resolveHistoryTarget('192.168.1.10:8080')).toBe(
      'https://192.168.1.10:8080',
    );
  });

  it('falls back to a DuckDuckGo Lite search for non-URL entries', () => {
    expect(resolveHistoryTarget('youtube music - lofi hip hop')).toBe(
      'https://lite.duckduckgo.com/lite/?q=youtube%20music%20-%20lofi%20hip%20hop',
    );
  });
});
