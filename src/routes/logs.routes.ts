import type { IncomingMessage, ServerResponse } from 'node:http';
import { recentLogs } from '../controllers/logs.controller.ts';

export async function handleLogsRoute(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (req.method !== 'GET' || url.pathname !== '/api/logs') {
    return false;
  }

  await recentLogs(res);
  return true;
}
