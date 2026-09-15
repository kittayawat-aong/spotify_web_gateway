import type { FastifyInstance } from 'fastify';
import { callback, login } from '../controllers/auth.controller.ts';

export function registerAuthRoutes(app: FastifyInstance): void {
  app.get('/auth/login', (_request, reply) => login(reply));

  app.get<{ Querystring: { code?: string } }>(
    '/auth/callback',
    async (request, reply) => callback(reply, request.query.code),
  );
}
