import type { FastifyReply } from 'fastify';
import {
  getDevices,
  getPlayback,
  next,
  pause,
  play,
  type SpotifyApiResponse,
} from '../services/spotify-playback.service.ts';
import { SpotifyTokenUnavailableError } from '../services/spotify-token.service.ts';

export async function playback(reply: FastifyReply): Promise<void> {
  await sendPlaybackResponse(reply, getPlayback);
}

export async function devices(reply: FastifyReply): Promise<void> {
  await sendPlaybackResponse(reply, getDevices);
}

export async function startPlayback(
  reply: FastifyReply,
  deviceId?: string,
): Promise<void> {
  await sendPlaybackResponse(reply, () => play(deviceId));
}

export async function pausePlayback(reply: FastifyReply): Promise<void> {
  await sendPlaybackResponse(reply, pause);
}

export async function nextTrack(reply: FastifyReply): Promise<void> {
  await sendPlaybackResponse(reply, next);
}

async function sendPlaybackResponse(
  reply: FastifyReply,
  action: () => Promise<SpotifyApiResponse>,
): Promise<void> {
  try {
    const response = await action();
    reply.code(response.status).send(response.body);
  } catch (error) {
    if (error instanceof SpotifyTokenUnavailableError) {
      reply.code(401).send({ message: error.message });
      return;
    }

    throw error;
  }
}
