import type { DigestRow } from './types.js';

// The one order for a night's rows; the page and the JSON both use it (ADR 0001).
export const sortRows = (rows: DigestRow[]): DigestRow[] => [...rows].sort((a, b) => a.job.localeCompare(b.job));
