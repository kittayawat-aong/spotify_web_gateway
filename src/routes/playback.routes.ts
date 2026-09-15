import type { FastifyInstance } from 'fastify';
import {
  devices,
  nextTrack,
  pausePlayback,
  playback,
  startPlayback,
} from '../controllers/playback.controller.ts';
import { authStatus } from '../controllers/auth-status.controller.ts';

export function registerPlaybackRoutes(app: FastifyInstance): void {
  app.get('/api/auth/status', async (_request, reply) => authStatus(reply));
  app.get('/api/playback', async (_request, reply) => playback(reply));
  app.get('/api/devices', async (_request, reply) => devices(reply));
  app.post<{ Querystring: { device_id?: string } }>(
    '/api/play',
    async (request, reply) => startPlayback(reply, request.query.device_id),
  );
  app.post('/api/pause', async (_request, reply) => pausePlayback(reply));
  app.post('/api/next', async (_request, reply) => nextTrack(reply));
}
