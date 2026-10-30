import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';

// Temp runs dir, so runs/ (read-only fixtures) is never touched.
const runsDir = mkdtempSync(join(tmpdir(), 'rig-routes-'));
const config = { adapter: 'shim', installed: 'x', beatEverySeconds: 60, runsDir };
const good = (job: string, status: string, at = '2026-02-01T01:00:00+01:00') =>
  JSON.stringify({ at, job, status, owner: 'rook' });

beforeAll(() => {
  writeFileSync(
    join(runsDir, '2026-02-01.jsonl'),
    [good('b/job', 'ok'), good('a/job', 'retry'), good('a/job', 'fail', '2026-02-01T02:00:00+01:00')].join('\n') + '\n',
  );
  writeFileSync(join(runsDir, '2026-02-02.jsonl'), '');
  writeFileSync(join(runsDir, '2026-02-03.jsonl'), [good('a/job', 'ok'), 'not json', ''].join('\n'));
});

describe('GET /digest/:night', () => {
  const app = createApp(config);

  it('200 with sorted rows for a night with runs', async () => {
    const res = await app.request('/digest/2026-02-01');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('digest 2026-02-01');
    expect(html.indexOf('>a/job<')).toBeLessThan(html.indexOf('>b/job<'));
    expect(html).toContain('✖ fail');
  });

  it('404 for a night with no file', async () => {
    expect((await app.request('/digest/1999-01-01')).status).toBe(404);
  });

  it('200 "nothing ran" for an empty night', async () => {
    const res = await app.request('/digest/2026-02-02');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('200 and counts the bad line for a night with one', async () => {
    const res = await app.request('/digest/2026-02-03');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('>a/job<');
    expect(html).toContain('1 bad line(s) skipped');
  });
});

describe('GET /api/digest/:night', () => {
  const app = createApp(config);

  it('200 with sorted rows for a night with runs', async () => {
    const res = await app.request('/api/digest/2026-02-01');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { night: string; badLines: number; rows: { job: string; runs: number; retries: number; lastStatus: string }[] };
    expect(body.night).toBe('2026-02-01');
    expect(body.badLines).toBe(0);
    expect(body.rows.map((r) => r.job)).toEqual(['a/job', 'b/job']);
    expect(body.rows[0]).toMatchObject({ runs: 2, retries: 1, lastStatus: 'fail' });
  });

  it('404 for a night with no file', async () => {
    const res = await app.request('/api/digest/1999-01-01');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'no such night' });
  });

  it('200 with no rows for an empty night', async () => {
    const res = await app.request('/api/digest/2026-02-02');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ night: '2026-02-02', badLines: 0, rows: [] });
  });

  it('200 and counts the bad line for a night with one', async () => {
    const res = await app.request('/api/digest/2026-02-03');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { badLines: number; rows: { job: string }[] };
    expect(body.badLines).toBe(1);
    expect(body.rows.map((r) => r.job)).toEqual(['a/job']);
  });
});
