import { readdirSync, readFileSync } from 'node:fs';
import type { RigConfig } from './config.js';
import { lastBeat, type Beat } from './heartbeat.js';

export type Status = {
  adapter: string;
  installed: string;
  lastBeat: Beat | null;
  nights: NightCounts[];
};

export type NightCounts = { night: string; ok: number; retry: number; fail: number };

// Log lines per status for one night; unreadable lines are skipped.
export function countNight(runsDir: string, night: string): NightCounts {
  const counts = { night, ok: 0, retry: 0, fail: 0 };
  let text = '';
  try {
    text = readFileSync(`${runsDir}/${night}.jsonl`, 'utf8');
  } catch {
    return counts;
  }
  for (const line of text.split('\n')) {
    try {
      const status = (JSON.parse(line) as { status?: unknown }).status;
      if (status === 'ok' || status === 'retry' || status === 'fail') counts[status]++;
    } catch {
      // blank or malformed line
    }
  }
  return counts;
}

// Nights on disk = runs/<YYYY-MM-DD>.jsonl, newest first.
export function nightsOnDisk(runsDir: string): string[] {
  try {
    return readdirSync(runsDir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f))
      .map((f) => f.slice(0, 10))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export function readStatus(config: RigConfig): Status {
  return {
    adapter: config.adapter,
    installed: config.installed,
    lastBeat: lastBeat(),
    nights: nightsOnDisk(config.runsDir).map((n) => countNight(config.runsDir, n)),
  };
}
