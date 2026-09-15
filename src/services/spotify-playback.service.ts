import { getSpotifyAccessToken } from './spotify-token.service.ts';

const spotifyApiBaseUrl = 'https://api.spotify.com/v1';

export interface SpotifyApiResponse {
  status: number;
  body: unknown;
}

export async function getPlayback(): Promise<SpotifyApiResponse> {
  return await spotifyRequest('/me/player', 'GET');
}

export async function getDevices(): Promise<SpotifyApiResponse> {
  return await spotifyRequest('/me/player/devices', 'GET');
}

export async function play(deviceId?: string): Promise<SpotifyApiResponse> {
  const query = deviceId
    ? `?${new URLSearchParams({ device_id: deviceId }).toString()}`
    : '';
  return await spotifyRequest(`/me/player/play${query}`, 'PUT');
}

export async function pause(): Promise<SpotifyApiResponse> {
  return await spotifyRequest('/me/player/pause', 'PUT');
}

export async function next(): Promise<SpotifyApiResponse> {
  return await spotifyRequest('/me/player/next', 'POST');
}

async function spotifyRequest(
  path: string,
  method: 'GET' | 'POST' | 'PUT',
): Promise<SpotifyApiResponse> {
  const accessToken = await getSpotifyAccessToken();
  const response = await fetch(`${spotifyApiBaseUrl}${path}`, {
    method,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return {
    status: response.status,
    body: await responseBody(response),
  };
}

async function responseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const body = await response.text();
  if (!body) {
    return null;
  }

  if (response.headers.get('content-type')?.includes('application/json')) {
    try {
      return JSON.parse(body) as unknown;
    } catch {
      // Some Spotify player commands return a non-JSON success body.
    }
  }

  return body;
}
