import type { ServerResponse } from 'node:http';
import { readRecentLogs } from '../lib/logger.ts';

export async function recentLogs(res: ServerResponse): Promise<void> {
  const logs = await readRecentLogs();
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(logs);
}
