// Plan § 1, run log reader. Types only: section 2 builds against these while the reader is written.

// One line of runs/<night>.jsonl, once parsed.
export type RunStatus = 'ok' | 'retry' | 'fail';

// One row per job for the night. Times are the log's own `at` strings, offset kept (styleguide).
export type DigestRow = {
  job: string;
  owner: string | null; // null in the log stays null here; the view shows `—`
  runs: number; // lines for this job, retries included
  retries: number; // lines with status `retry`
  lastStatus: RunStatus;
  lastError: string | null; // `error` of the latest line that had one, else null
  firstAt: string;
  lastAt: string;
};

export type Night = {
  night: string; // YYYY-MM-DD
  rows: DigestRow[];
  // Lines that aren't valid JSON or lack a required field. Counted, never thrown;
  // blank lines don't count. The rows from the good lines still render.
  badLines: number;
};

// Reads `<runsDir>/<night>.jsonl`. Returns null when there is no such file.
export type ReadNight = (runsDir: string, night: string) => Night | null;
