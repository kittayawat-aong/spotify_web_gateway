/** OpenAPI document exposed at GET /openapi.json. */
export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Spotify Web Gateway',
    version: '1.0.0',
    description:
      'A small OAuth gateway for authorizing a user with Spotify and exchanging the authorization code for tokens.',
  },
  servers: [{ url: 'http://127.0.0.1:3000', description: 'Local server' }],
  paths: {
    '/auth/login': {
      get: {
        summary: 'Start Spotify authorization',
        responses: {
          '302': { description: 'Redirect to the Spotify authorization screen.' },
        },
      },
    },
    '/auth/callback': {
      get: {
        summary: 'Handle Spotify authorization callback',
        parameters: [
          {
            name: 'code',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Spotify token response.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TokenResponse' },
              },
            },
          },
          '400': { description: 'No authorization code was supplied.' },
        },
      },
    },
  },
  components: {
    schemas: {
      TokenResponse: {
        type: 'object',
        properties: {
          access_token: { type: 'string' },
          token_type: { type: 'string', example: 'Bearer' },
          expires_in: { type: 'integer', example: 3600 },
          refresh_token: { type: 'string' },
          scope: { type: 'string' },
        },
      },
    },
  },
} as const;
