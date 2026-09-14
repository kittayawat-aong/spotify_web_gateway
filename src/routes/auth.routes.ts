import type { IncomingMessage, ServerResponse } from 'node:http';
import { callback, login } from '../controllers/auth.controller.ts';

export async function handleAuthRoute(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (req.method !== 'GET') {
    return false;
  }

  if (url.pathname === '/auth/login') {
    login(res);
    return true;
  }

  if (url.pathname === '/auth/callback') {
    await callback(res, url);
    return true;
  }

  return false;
}
