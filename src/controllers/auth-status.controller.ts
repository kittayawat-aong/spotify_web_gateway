import type { FastifyReply } from 'fastify';
import {
  getSpotifyAccessToken,
  SpotifyTokenUnavailableError,
} from '../services/spotify-token.service.ts';

export async function authStatus(reply: FastifyReply): Promise<void> {
  try {
    await getSpotifyAccessToken();
    await reply.send({ authorized: true });
  } catch (error) {
    if (error instanceof SpotifyTokenUnavailableError) {
      await reply.send({ authorized: false });
      return;
    }

    throw error;
  }
}
