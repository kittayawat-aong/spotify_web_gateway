import type { FastifyReply } from 'fastify';

export function sendJson(
  reply: FastifyReply,
  status: number,
  body: unknown,
): FastifyReply {
  if (status === 204) {
    return reply.code(status).send();
  }

  const payload = typeof body === 'string' ? JSON.stringify(body) : body;
  return reply
    .code(status)
    .type('application/json; charset=utf-8')
    .send(payload);
}
