import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { Night, ReadNight } from '../src/digest/types.js';

const config = { adapter: 'shim', installed: 'x', beatEverySeconds: 60, runsDir: 'runs' };
const row = { job: 'b', owner: null, runs: 4, retries: 3, lastStatus: 'fail' as const, lastError: null, firstAt: 'a', lastAt: 'z' };
const nights: Record<string, Night> = {
  '2026-10-28': { night: '2026-10-28', badLines: 0, rows: [row, { ...row, job: 'a', retries: 0, lastStatus: 'ok' }] },
  '2026-10-29': { night: '2026-10-29', badLines: 0, rows: [] },
};
const read: ReadNight = (_d, n) => nights[n] ?? null;

describe('digest page', () => {
  it('renders sorted rows with marks and dashes', async () => {
    const res = await createApp(config, read).request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html.indexOf('>a<')).toBeLessThan(html.indexOf('>b<'));
    expect(html).toContain('✖ fail');
    expect(html).toContain('—');
  });
  it('404 for a missing night, "nothing ran" for an empty one', async () => {
    const app = createApp(config, read);
    expect((await app.request('/digest/2020-01-01')).status).toBe(404);
    expect(await (await app.request('/digest/2026-10-29')).text()).toContain('nothing ran');
  });
});
