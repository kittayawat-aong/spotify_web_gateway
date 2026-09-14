import type { IncomingMessage, ServerResponse } from 'node:http';
import { sendJson } from './lib/http-response.ts';
import { handleAuthRoute } from './routes/auth.routes.ts';
import { handleDocsRoute } from './routes/docs.routes.ts';

export async function app(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

  try {
    if (await handleDocsRoute(req, res, url)) {
      return;
    }

    if (await handleAuthRoute(req, res, url)) {
      return;
    }

    sendJson(res, 404, { message: 'Not Found' });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { message: 'Internal Server Error' });
  }
}
