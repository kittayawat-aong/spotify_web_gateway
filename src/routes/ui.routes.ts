import type { IncomingMessage, ServerResponse } from 'node:http';
import { renderUi } from '../controllers/ui.controller.ts';

export function handleUiRoute(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): boolean {
  if (req.method !== 'GET' || url.pathname !== '/') {
    return false;
  }

  renderUi(res);
  return true;
}
