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
    '/': {
      get: {
        summary: 'Spotify Remote web UI',
        responses: { '200': { description: 'HTML control page.' } },
      },
    },
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
    '/api/playback': {
      get: {
        summary: 'Get current playback state',
        responses: {
          '200': { description: 'Current playback state.' },
          '204': { description: 'No active playback.' },
          '401': { $ref: '#/components/responses/TokenUnavailable' },
        },
      },
    },
    '/api/auth/status': {
      get: {
        summary: 'Check whether a valid Spotify authorization is stored',
        responses: { '200': { description: 'Authorization status.' } },
      },
    },
    '/api/logs': {
      get: {
        summary: 'Read recent gateway logs',
        responses: { '200': { description: 'Recent request and error logs.' } },
      },
    },
    '/api/devices': {
      get: {
        summary: 'Get available Spotify Connect devices',
        responses: {
          '200': { description: 'Available devices.' },
          '401': { $ref: '#/components/responses/TokenUnavailable' },
        },
      },
    },
    '/api/play': {
      post: {
        summary: 'Start or resume playback',
        parameters: [
          {
            name: 'device_id',
            in: 'query',
            required: false,
            description: 'Spotify Connect device to start playback on.',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '204': { description: 'Playback started.' },
          '401': { $ref: '#/components/responses/TokenUnavailable' },
          '403': { description: 'Spotify Premium is required.' },
        },
      },
    },
    '/api/pause': {
      post: {
        summary: 'Pause playback',
        responses: {
          '204': { description: 'Playback paused.' },
          '401': { $ref: '#/components/responses/TokenUnavailable' },
          '403': { description: 'Spotify Premium is required.' },
        },
      },
    },
    '/api/next': {
      post: {
        summary: 'Skip to the next track',
        responses: {
          '204': { description: 'Skipped to the next track.' },
          '401': { $ref: '#/components/responses/TokenUnavailable' },
          '403': { description: 'Spotify Premium is required.' },
        },
      },
    },
  },
  components: {
    responses: {
      TokenUnavailable: {
        description: 'No stored token exists or the stored token has expired.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['message'],
              properties: { message: { type: 'string' } },
            },
          },
        },
      },
    },
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
