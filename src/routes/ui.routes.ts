import type { FastifyInstance } from 'fastify';
import { renderUi } from '../controllers/ui.controller.ts';

export function registerUiRoutes(app: FastifyInstance): void {
  app.get('/', (_request, reply) => renderUi(reply));
}
