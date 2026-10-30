import type { DigestRow, Night } from '../digest/types.js';

const dash = '—';

export function DigestPage({ night }: { night: Night }) {
  const rows = [...night.rows].sort((a, b) => a.job.localeCompare(b.job));
  return (
    <>
      <h1>digest {night.night}</h1>
      {rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr><th>job</th><th>owner</th><th>runs</th><th>retries</th><th>last</th><th>error</th><th>first</th><th>last at</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Row row={r} />
            ))}
          </tbody>
        </table>
      )}
      {night.badLines > 0 && <p class="mute">{night.badLines} bad line(s) skipped</p>}
    </>
  );
}

function Row({ row }: { row: DigestRow }) {
  const manyRetries = row.retries >= 3;
  const failed = row.lastStatus === 'fail';
  return (
    <tr>
      <td>{row.job || dash}</td>
      <td>{row.owner ?? dash}</td>
      <td>{row.runs}</td>
      <td class={manyRetries ? 'warn' : undefined}>{row.retries}{manyRetries ? ' ⚠' : ''}</td>
      <td class={failed ? 'warn' : undefined}>{failed ? '✖ fail' : row.lastStatus}</td>
      <td>{row.lastError ?? dash}</td>
      <td>{row.firstAt || dash}</td>
      <td>{row.lastAt || dash}</td>
    </tr>
  );
}
