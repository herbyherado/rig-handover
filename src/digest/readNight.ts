import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, ReadNight, RunStatus } from './types.js';

// Plan § 1. One parsed line of the log; anything that doesn't fit this shape is a bad line.
type Run = { at: string; job: string; status: RunStatus; owner: string | null; error: string | null };

const STATUSES: readonly string[] = ['ok', 'retry', 'fail'] satisfies RunStatus[];

function parseLine(line: string): Run | null {
  let v: unknown;
  try {
    v = JSON.parse(line);
  } catch {
    return null;
  }
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  if (typeof o.at !== 'string' || typeof o.job !== 'string') return null;
  if (typeof o.status !== 'string' || !STATUSES.includes(o.status)) return null;
  if (o.owner !== null && typeof o.owner !== 'string') return null;
  if (o.error !== undefined && typeof o.error !== 'string') return null;
  return {
    at: o.at,
    job: o.job,
    status: o.status as RunStatus,
    owner: o.owner,
    error: o.error ?? null,
  };
}

// Rows come in order of each job's first line. The log is append-only, so line order is time order.
export const readNight: ReadNight = (runsDir, night) => {
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    return null;
  }

  const rows = new Map<string, DigestRow>();
  let badLines = 0;
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    const run = parseLine(line);
    if (!run) {
      badLines++;
      continue;
    }
    const row = rows.get(run.job);
    if (!row) {
      rows.set(run.job, {
        job: run.job,
        owner: run.owner,
        runs: 1,
        retries: run.status === 'retry' ? 1 : 0,
        lastStatus: run.status,
        lastError: run.error,
        firstAt: run.at,
        lastAt: run.at,
      });
      continue;
    }
    row.owner = run.owner;
    row.runs++;
    if (run.status === 'retry') row.retries++;
    row.lastStatus = run.status;
    if (run.error !== null) row.lastError = run.error;
    row.lastAt = run.at;
  }

  return { night, rows: [...rows.values()], badLines };
};
