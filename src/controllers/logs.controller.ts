import type { FastifyReply } from 'fastify';
import { readRecentLogs } from '../lib/logger.ts';

export async function recentLogs(reply: FastifyReply): Promise<void> {
  const logs = await readRecentLogs();
  await reply.type('text/plain; charset=utf-8').send(logs);
}
