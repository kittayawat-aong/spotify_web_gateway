import type { FastifyReply } from 'fastify';
import {
  createAuthorizationUrl,
  exchangeAuthorizationCode,
} from '../services/spotify-auth.service.ts';
import { saveSpotifyToken } from '../services/spotify-token.service.ts';

export function login(reply: FastifyReply): void {
  reply.redirect(createAuthorizationUrl());
}

export async function callback(
  reply: FastifyReply,
  code: string | undefined,
): Promise<void> {
  if (!code) {
    reply.code(400).send({ message: 'Missing authorization code' });
    return;
  }

  const tokenResponse = await exchangeAuthorizationCode(code);
  if (tokenResponse.status === 200) {
    await saveSpotifyToken(tokenResponse.body);
    reply.redirect('/');
    return;
  }

  reply.code(tokenResponse.status).send(tokenResponse.body);
}
