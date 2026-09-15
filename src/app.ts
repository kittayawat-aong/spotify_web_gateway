import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { sendJson } from './lib/http-response.ts';
import {
  auditAction,
  auditHeaders,
  auditQuery,
  logError,
  logRequest,
} from './lib/logger.ts';
import { handleAuthRoute } from './routes/auth.routes.ts';
import { handleDocsRoute } from './routes/docs.routes.ts';
import { handleLogsRoute } from './routes/logs.routes.ts';
import { handlePlaybackRoute } from './routes/playback.routes.ts';
import { handleUiRoute } from './routes/ui.routes.ts';

export async function app(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
  const startedAt = performance.now();
  const socketBytesAtStart = req.socket.bytesWritten;
  const requestId = randomUUID();
  const action = auditAction(req.method, url.pathname);
  res.setHeader('X-Request-Id', requestId);

  res.once('finish', () => {
    logRequest({
      requestId,
      method: req.method ?? 'UNKNOWN',
      path: url.pathname,
      query: auditQuery(url),
      headers: auditHeaders(req.headers),
      remoteAddress: req.socket.remoteAddress,
      remotePort: req.socket.remotePort,
      userAgent: req.headers['user-agent'],
      action,
      status: res.statusCode,
      durationMs: performance.now() - startedAt,
      responseBytes: Math.max(0, req.socket.bytesWritten - socketBytesAtStart),
    });
  });

  try {
    if (handleUiRoute(req, res, url)) {
      return;
    }

    if (await handleDocsRoute(req, res, url)) {
      return;
    }

    if (await handleLogsRoute(req, res, url)) {
      return;
    }

    if (await handleAuthRoute(req, res, url)) {
      return;
    }

    if (await handlePlaybackRoute(req, res, url)) {
      return;
    }

    sendJson(res, 404, { message: 'Not Found' });
  } catch (error) {
    console.error(error);
    logError(error, {
      requestId,
      method: req.method ?? 'UNKNOWN',
      path: url.pathname,
      action,
    });
    sendJson(res, 500, { message: 'Internal Server Error' });
  }
}
