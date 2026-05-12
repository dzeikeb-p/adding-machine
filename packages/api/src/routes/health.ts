import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

const HealthSchema = z
  .object({
    status: z.literal('ok'),
    version: z.string(),
    commit: z.string(),
  })
  .openapi('Health');

const route = createRoute({
  method: 'get',
  path: '/health',
  tags: ['Meta'],
  summary: 'Health check',
  responses: {
    200: {
      content: { 'application/json': { schema: HealthSchema } },
      description: 'Service is up',
    },
  },
});

export function registerHealth(app: OpenAPIHono<{ Bindings: Bindings }>) {
  app.openapi(route, (c) => {
    return c.json({
      status: 'ok' as const,
      version: c.env?.VERSION ?? '0.0.0',
      commit: c.env?.COMMIT_SHA ?? 'dev',
    });
  });
}
