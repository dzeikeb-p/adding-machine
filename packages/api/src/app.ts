import { OpenAPIHono } from '@hono/zod-openapi';
import './types.js';
import { handleMcpRequest } from '@adding-machine/mcp';
import { apiReference } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { registerCutup } from './routes/cutup.js';
import { registerHealth } from './routes/health.js';
import { registerMethods } from './routes/methods.js';

export function createApp() {
  const app = new OpenAPIHono<{ Bindings: Bindings }>({
    defaultHook: (result, c) => {
      if (!result.success) {
        const isTooLarge = result.error.issues.some(
          (issue) =>
            issue.code === 'too_big' &&
            (issue.path.includes('text') || issue.path.includes('textB')),
        );
        if (isTooLarge) {
          return c.json({ error: 'Input text exceeds the 100 KB limit.' }, 413);
        }
        return c.json({ error: 'Validation failed', issues: result.error.issues }, 422);
      }
    },
  });

  // CORS — allow all origins for the public API
  app.use('*', cors());

  // Rate limiting via Cloudflare Workers Rate Limiting API (optional binding)
  app.use('*', async (c, next) => {
    const limiter = c.env?.RATE_LIMITER;
    if (limiter) {
      const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? 'unknown';
      const { success } = await limiter.limit({ key: ip });
      if (!success) {
        return c.json({ error: 'Rate limit exceeded. Max 60 requests per minute.' }, 429);
      }
    }
    return next();
  });

  registerHealth(app);
  registerMethods(app);
  registerCutup(app);

  // MCP server — Web Standard streamable HTTP, stateless (one instance per request)
  app.all('/mcp', (c) => handleMcpRequest(c.req.raw));

  // OpenAPI spec
  app.doc('/openapi.json', {
    openapi: '3.0.0',
    info: {
      title: "Gysin's Adding Machine",
      version: '0.1.0',
      description:
        'A digital instrument implementing Brion Gysin\'s cut-up and permutation techniques.',
      contact: { url: 'https://brightlinekillcount.com' },
    },
    servers: [{ url: 'https://adding-machine.workers.dev', description: 'Production' }],
  });

  // Scalar API reference UI
  app.get(
    '/docs',
    apiReference({
      pageTitle: "Gysin's Adding Machine — API Reference",
      url: '/openapi.json',
    }),
  );

  return app;
}

export type App = ReturnType<typeof createApp>;
