import type { ServerResponse } from 'node:http';
import { sendJson } from '../lib/http-response.ts';
import {
  getSpotifyAccessToken,
  SpotifyTokenUnavailableError,
} from '../services/spotify-token.service.ts';

export async function authStatus(res: ServerResponse): Promise<void> {
  try {
    await getSpotifyAccessToken();
    sendJson(res, 200, { authorized: true });
  } catch (error) {
    if (error instanceof SpotifyTokenUnavailableError) {
      sendJson(res, 200, { authorized: false });
      return;
    }

    throw error;
  }
}
