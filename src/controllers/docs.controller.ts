import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FastifyReply } from 'fastify';
import { openApiDocument } from '../docs/openapi.ts';

const swaggerUiDirectory = dirname(
  fileURLToPath(import.meta.resolve('swagger-ui-dist/package.json')),
);

const swaggerUiAssets = new Map([
  ['swagger-ui.css', 'text/css; charset=utf-8'],
  ['swagger-ui-bundle.js', 'application/javascript; charset=utf-8'],
  ['swagger-ui-standalone-preset.js', 'application/javascript; charset=utf-8'],
]);

const swaggerUiHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Spotify Web Gateway API</title>
    <link rel="stylesheet" href="/docs/assets/swagger-ui.css">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/docs/assets/swagger-ui-bundle.js"></script>
    <script src="/docs/assets/swagger-ui-standalone-preset.js"></script>
    <script>
      SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout',
      });
    </script>
  </body>
</html>`;

export function renderSwaggerUi(reply: FastifyReply): FastifyReply {
  return reply.type('text/html; charset=utf-8').send(swaggerUiHtml);
}

export function getOpenApiDocument(reply: FastifyReply): FastifyReply {
  return reply.send(openApiDocument);
}

export async function serveSwaggerUiAsset(
  reply: FastifyReply,
  assetName: string,
): Promise<void> {
  const contentType = swaggerUiAssets.get(assetName);

  if (!contentType) {
    await reply.code(404).send({ message: 'Not Found' });
    return;
  }

  const asset = await readFile(join(swaggerUiDirectory, assetName));
  await reply.type(contentType).send(asset);
}
