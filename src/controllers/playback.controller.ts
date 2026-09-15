import type { ServerResponse } from 'node:http';
import { sendJson } from '../lib/http-response.ts';
import {
  getDevices,
  getPlayback,
  next,
  pause,
  play,
  type SpotifyApiResponse,
} from '../services/spotify-playback.service.ts';
import { SpotifyTokenUnavailableError } from '../services/spotify-token.service.ts';

export async function playback(res: ServerResponse): Promise<void> {
  await sendPlaybackResponse(res, getPlayback);
}

export async function devices(res: ServerResponse): Promise<void> {
  await sendPlaybackResponse(res, getDevices);
}

export async function startPlayback(
  res: ServerResponse,
  deviceId?: string,
): Promise<void> {
  await sendPlaybackResponse(res, () => play(deviceId));
}

export async function pausePlayback(res: ServerResponse): Promise<void> {
  await sendPlaybackResponse(res, pause);
}

export async function nextTrack(res: ServerResponse): Promise<void> {
  await sendPlaybackResponse(res, next);
}

async function sendPlaybackResponse(
  res: ServerResponse,
  action: () => Promise<SpotifyApiResponse>,
): Promise<void> {
  try {
    const response = await action();
    sendJson(res, response.status, response.body);
  } catch (error) {
    if (error instanceof SpotifyTokenUnavailableError) {
      sendJson(res, 401, { message: error.message });
      return;
    }

    throw error;
  }
}
