import type { ServerResponse } from 'node:http';
import { sendJson } from '../lib/http-response.ts';
import {
  createAuthorizationUrl,
  exchangeAuthorizationCode,
} from '../services/spotify-auth.service.ts';
import { saveSpotifyToken } from '../services/spotify-token.service.ts';

export function login(res: ServerResponse): void {
  res.writeHead(302, { Location: createAuthorizationUrl() });
  res.end();
}

export async function callback(res: ServerResponse, url: URL): Promise<void> {
  const code = url.searchParams.get('code');

  if (!code) {
    sendJson(res, 400, { message: 'Missing authorization code' });
    return;
  }

  const tokenResponse = await exchangeAuthorizationCode(code);
  if (tokenResponse.status === 200) {
    await saveSpotifyToken(tokenResponse.body);
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  sendJson(res, tokenResponse.status, tokenResponse.body);
}
