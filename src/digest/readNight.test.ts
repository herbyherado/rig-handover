import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readNight } from './readNight.js';

describe('readNight on runs/2026-10-28.jsonl', () => {
  const night = readNight('runs', '2026-10-28')!;

  it('gives one row per job and counts the bad line', () => {
    expect(night.night).toBe('2026-10-28');
    expect(night.rows.map((r) => r.job)).toEqual([
      'rig/rotate-logs',
      'lane/sync',
      'fixtures/refresh',
      'notes/backup',
      'digest/render',
    ]);
    expect(night.badLines).toBe(1);
  });

  it('counts runs and retries, keeps the last status and error', () => {
    const byJob = Object.fromEntries(night.rows.map((r) => [r.job, r]));
    expect(byJob['lane/sync']).toMatchObject({ runs: 8, retries: 1, lastStatus: 'ok', lastError: 'lock held' });
    expect(byJob['fixtures/refresh']).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', lastError: 'upstream 503' });
    expect(byJob['notes/backup']).toMatchObject({ runs: 1, retries: 0, lastStatus: 'fail', lastError: 'quota exceeded' });
    expect(byJob['rig/rotate-logs']).toMatchObject({ runs: 1, lastStatus: 'ok', lastError: null });
  });

  it('keeps a null owner row', () => {
    const row = night.rows.find((r) => r.job === 'digest/render');
    expect(row).toMatchObject({ owner: null, runs: 1, lastStatus: 'ok' });
  });

  it('keeps times with their offset', () => {
    const row = night.rows.find((r) => r.job === 'lane/sync')!;
    expect(row.firstAt).toBe('2026-10-28T23:00:06+01:00');
    expect(row.lastAt).toBe('2026-10-29T05:00:04+01:00');
  });
});

describe('readNight edge cases', () => {
  it('returns null when the night has no file', () => {
    expect(readNight('runs', '1999-01-01')).toBeNull();
  });

  it('counts lines missing a field or with an unknown status, skips blank lines', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
    writeFileSync(
      join(dir, '2026-01-01.jsonl'),
      [
        '{"at":"2026-01-01T01:00:00+01:00","job":"a","status":"ok","owner":"x"}',
        '',
        '{"at":"2026-01-01T01:00:00+01:00","job":"a","status":"maybe","owner":"x"}',
        '{"job":"a","status":"ok","owner":"x"}',
        '[]',
        'not json',
        '',
      ].join('\n'),
    );
    const night = readNight(dir, '2026-01-01')!;
    expect(night.rows).toHaveLength(1);
    expect(night.badLines).toBe(4);
  });
});
