import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  devices,
  nextTrack,
  pausePlayback,
  playback,
  startPlayback,
} from '../controllers/playback.controller.ts';
import { authStatus } from '../controllers/auth-status.controller.ts';

export async function handlePlaybackRoute(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (req.method === 'GET' && url.pathname === '/api/auth/status') {
    await authStatus(res);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/api/playback') {
    await playback(res);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/api/devices') {
    await devices(res);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/api/play') {
    await startPlayback(res, url.searchParams.get('device_id') ?? undefined);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/api/pause') {
    await pausePlayback(res);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/api/next') {
    await nextTrack(res);
    return true;
  }

  return false;
}
