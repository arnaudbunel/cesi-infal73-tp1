import Fastify from 'fastify';
import type { FastifyError, FastifyInstance } from 'fastify';
import type { LabHooks } from './lab.js';
import { OrdersRepository } from './repositories/orders.repository.js';
import { ordersRoutes } from './routes/orders.routes.js';
import { OrdersService } from './services/orders.service.js';

export interface BuildAppOptions {
  logger?: boolean;
  /** Mode laboratoire : active les points d'injection de panne. Interdit en production. */
  labMode?: boolean;
  lab?: LabHooks;
}

/** Chaque appel crée une application neuve, avec des données initiales neuves. */
export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const { logger = false, labMode = false, lab } = options;

  if (labMode && process.env['NODE_ENV'] === 'production') {
    throw new Error('labMode is forbidden when NODE_ENV=production');
  }
  if (lab && !labMode) {
    throw new Error('Lab hooks require buildApp({ labMode: true })');
  }

  const app = Fastify({ logger });
  const service = new OrdersService(new OrdersRepository(), labMode ? lab : undefined);

  if (labMode && lab?.onRequest) {
    const onRequest = lab.onRequest;
    app.addHook('onRequest', async (request) => {
      await onRequest({ method: request.method, url: request.url, headers: { ...request.headers } });
    });
  }

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    const status = typeof error.statusCode === 'number' ? error.statusCode : 500;
    if (error.validation) {
      return reply.code(400).send({ statusCode: 400, error: 'Bad Request', message: error.message });
    }
    if (status < 500) {
      return reply.code(status).send({ error: error.message });
    }
    return reply.code(500).send({ message: error.message, stack: error.stack });
  });

  void app.register(ordersRoutes(service));
  return app;
}
