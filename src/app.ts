import { randomUUID } from 'node:crypto';
import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import {
  auditAction,
  auditHeaders,
  auditQuery,
  logError,
  logRequest,
} from './lib/logger.ts';
import { registerAuthRoutes } from './routes/auth.routes.ts';
import { registerDocsRoutes } from './routes/docs.routes.ts';
import { registerLogsRoutes } from './routes/logs.routes.ts';
import { registerPlaybackRoutes } from './routes/playback.routes.ts';
import { registerUiRoutes } from './routes/ui.routes.ts';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: false,
    genReqId: () => randomUUID(),
  });
  const startedAt = new WeakMap<object, number>();

  app.addHook('onRequest', (request, reply, done) => {
    startedAt.set(request, performance.now());
    reply.header('X-Request-Id', request.id);
    done();
  });

  app.addHook('onResponse', (request, reply, done) => {
    const url = requestUrl(request);
    logRequest({
      requestId: request.id,
      method: request.method,
      path: url.pathname,
      query: auditQuery(url),
      headers: auditHeaders(request.headers),
      remoteAddress: request.ip,
      remotePort: request.socket.remotePort,
      userAgent: request.headers['user-agent'],
      action: auditAction(
        request.method,
        request.routeOptions.url ?? url.pathname,
      ),
      status: reply.statusCode,
      durationMs:
        performance.now() - (startedAt.get(request) ?? performance.now()),
      responseBytes: Number(reply.getHeader('content-length') ?? 0),
    });
    done();
  });

  app.setErrorHandler((error, request, reply) => {
    const url = requestUrl(request);
    logError(error, {
      requestId: request.id,
      method: request.method,
      path: url.pathname,
      action: auditAction(
        request.method,
        request.routeOptions.url ?? url.pathname,
      ),
    });
    reply.code(500).send({ message: 'Internal Server Error' });
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.code(404).send({ message: 'Not Found' });
  });

  registerUiRoutes(app);
  registerDocsRoutes(app);
  registerLogsRoutes(app);
  registerAuthRoutes(app);
  registerPlaybackRoutes(app);

  return app;
}

function requestUrl(request: FastifyRequest): URL {
  return new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);
}
