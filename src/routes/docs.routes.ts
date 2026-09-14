import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  getOpenApiDocument,
  renderSwaggerUi,
  serveSwaggerUiAsset,
} from '../controllers/docs.controller.ts';

export async function handleDocsRoute(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (req.method !== 'GET') {
    return false;
  }

  if (url.pathname === '/openapi.json') {
    getOpenApiDocument(res);
    return true;
  }

  if (url.pathname === '/docs') {
    renderSwaggerUi(res);
    return true;
  }

  if (url.pathname.startsWith('/docs/assets/')) {
    return serveSwaggerUiAsset(
      res,
      url.pathname.slice('/docs/assets/'.length),
    );
  }

  return false;
}
