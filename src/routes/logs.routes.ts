import type { FastifyInstance } from 'fastify';
import { recentLogs } from '../controllers/logs.controller.ts';

export function registerLogsRoutes(app: FastifyInstance): void {
  app.get('/api/logs', async (_request, reply) => {
    await recentLogs(reply);
  });
}
