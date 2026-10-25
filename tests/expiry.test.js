import { describe, it, expect } from 'vitest';
import { parseLaunch, getWindow, getPhase, formatRemaining } from '../src/expiry.js';
import { DEFAULT_LAUNCH_AT, WINDOW_MS } from '../src/config.js';

const H = 3600_000;

describe('parseLaunch', () => {
  it('parses ISO strings with an explicit offset', () => {
    expect(parseLaunch('2026-10-26T09:00:00+03:00')).toBe(Date.UTC(2026, 9, 26, 6, 0, 0));
    expect(parseLaunch('2026-10-26T06:00:00Z')).toBe(Date.UTC(2026, 9, 26, 6, 0, 0));
    expect(parseLaunch('2026-10-26T06:00Z')).toBe(Date.UTC(2026, 9, 26, 6, 0, 0));
  });

  it('accepts epoch milliseconds', () => {
    expect(parseLaunch(1_000)).toBe(1_000);
  });

  it('rejects values without a time-zone offset', () => {
    expect(() => parseLaunch('2026-10-26T09:00:00')).toThrow(/offset/);
  });

  it('rejects empty, malformed or impossible values', () => {
    expect(() => parseLaunch('')).toThrow();
    expect(() => parseLaunch('tomorrow+03:00')).toThrow();
    expect(() => parseLaunch('2026-13-45T09:00:00+03:00')).toThrow();
    expect(() => parseLaunch(Number.NaN)).toThrow();
    expect(() => parseLaunch(undefined)).toThrow();
  });

  it('the shipped default launch time is valid', () => {
    expect(() => parseLaunch(DEFAULT_LAUNCH_AT)).not.toThrow();
  });
});

describe('getWindow / getPhase', () => {
  const win = getWindow('2026-10-26T09:00:00+03:00');

  it('ends exactly 24 hours after launch', () => {
    expect(WINDOW_MS).toBe(24 * H);
    expect(win.end - win.start).toBe(24 * H);
  });

  it('is "before" until the launch instant', () => {
    expect(getPhase(win.start - 1, win)).toBe('before');
    expect(getPhase(win.start - 5 * H, win)).toBe('before');
  });

  it('is "active" from launch (inclusive) until end (exclusive)', () => {
    expect(getPhase(win.start, win)).toBe('active');
    expect(getPhase(win.start + 12 * H, win)).toBe('active');
    expect(getPhase(win.end - 1, win)).toBe('active');
  });

  it('is "expired" from the end instant on', () => {
    expect(getPhase(win.end, win)).toBe('expired');
    expect(getPhase(win.end + 365 * 24 * H, win)).toBe('expired');
  });
});

describe('formatRemaining', () => {
  it('uses Arabic counting words and digits', () => {
    expect(formatRemaining(60_000)).toBe('دقيقة');
    expect(formatRemaining(2 * 60_000)).toBe('دقيقتين');
    expect(formatRemaining(3 * H + 20 * 60_000)).toBe('٣ ساعات و ٢٠ دقيقة');
    expect(formatRemaining(H)).toBe('ساعة');
    expect(formatRemaining(26 * H)).toBe('يوم و ساعتين');
    expect(formatRemaining(15 * 24 * H)).toBe('١٥ يوم');
  });

  it('never shows zero', () => {
    expect(formatRemaining(0)).toBe('دقيقة');
  });
});
