import type { FastifyInstance } from 'fastify';
import {
  getOpenApiDocument,
  renderSwaggerUi,
  serveSwaggerUiAsset,
} from '../controllers/docs.controller.ts';

export function registerDocsRoutes(app: FastifyInstance): void {
  app.get('/openapi.json', (_request, reply) => getOpenApiDocument(reply));
  app.get('/docs', (_request, reply) => renderSwaggerUi(reply));

  app.get<{ Params: { assetName: string } }>(
    '/docs/assets/:assetName',
    async (request, reply) =>
      serveSwaggerUiAsset(reply, request.params.assetName),
  );
}
