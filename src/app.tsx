import { Hono } from 'hono';
import { readNight as readNightFromDisk } from './digest/readNight.js';
import { sortRows } from './digest/sortRows.js';
import type { ReadNight } from './digest/types.js';
import { loadConfig, type RigConfig } from './config.js';
import { lane } from './lane.js';
import { readStatus } from './status.js';
import { DigestPage } from './views/digest.js';
import { Layout } from './views/layout.js';
import { StatusBoard } from './views/status.js';

// `readNight` can be swapped out in tests; by default it reads runs/ from disk.
export function createApp(config: RigConfig = loadConfig(), readNight: ReadNight = readNightFromDisk) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));

  app.get('/', (c) =>
    c.html(
      <Layout title="status" lane={lane()}>
        <StatusBoard status={readStatus(config)} />
      </Layout>,
    ),
  );

  app.get('/digest/:night', (c) => {
    const name = c.req.param('night');
    const night = /^\d{4}-\d{2}-\d{2}$/.test(name) ? readNight(config.runsDir, name) : null;
    if (!night) return c.text('no such night', 404);
    return c.html(
      <Layout title={`digest ${name}`} lane={lane()}>
        <DigestPage night={night} />
      </Layout>,
    );
  });

  app.get('/api/digest/:night', (c) => {
    const name = c.req.param('night');
    const night = /^\d{4}-\d{2}-\d{2}$/.test(name) ? readNight(config.runsDir, name) : null;
    if (!night) return c.json({ error: 'no such night' }, 404);
    return c.json({ ...night, rows: sortRows(night.rows) });
  });

  return app;
}
