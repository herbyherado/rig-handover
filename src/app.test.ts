import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { loadConfig } from './config.js';

describe('GET /api/digest/:night', () => {
  const app = createApp(loadConfig());

  it('lists the same jobs, in the same order, as the page', async () => {
    const res = await app.request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    const { rows } = (await res.json()) as { rows: { job: string }[] };
    const html = await (await app.request('/digest/2026-10-28')).text();
    const inPage = rows.map((r) => html.indexOf(`<td>${r.job}</td>`));
    expect(rows.length).toBeGreaterThan(0);
    expect(inPage.every((i) => i >= 0)).toBe(true);
    expect([...inPage].sort((a, b) => a - b)).toEqual(inPage);
  });

  it('404s for a night with no file', async () => {
    expect((await app.request('/api/digest/1999-01-01')).status).toBe(404);
  });
});
