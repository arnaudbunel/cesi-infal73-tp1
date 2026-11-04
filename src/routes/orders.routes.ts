import type { FastifyPluginAsync } from 'fastify';
import { isOrderStatus } from '../domain/order.js';
import type { Order } from '../domain/order.js';
import { createOrderSchema } from '../schemas/orders.schema.js';
import type { CreateOrderBody } from '../schemas/orders.schema.js';
import type { OrdersService } from '../services/orders.service.js';

interface Link {
  href: string;
  method: string;
}

/** Représentation HTTP d'une commande avec liens (format personnalisé, non HAL). */
function represent(order: Order) {
  const href = `/api/orders/${order.id}`;
  const self: Link = { href, method: 'GET' };
  const cancel: Link = { href: `${href}/cancellations`, method: 'POST' };
  return { ...order, _links: { self, cancel } };
}

function readTargetStatus(body: unknown): unknown {
  return typeof body === 'object' && body !== null && 'status' in body ? body.status : undefined;
}

export function ordersRoutes(service: OrdersService): FastifyPluginAsync {
  return async (app) => {
    app.get('/api/orders', async () => {
      const orders = await service.list();
      return orders.map(represent);
    });

    app.get<{ Params: { id: string } }>('/api/orders/:id', async (request, reply) => {
      const order = await service.get(request.params.id);
      return reply.code(200).send(order ? represent(order) : null);
    });

    app.post<{ Body: CreateOrderBody }>(
      '/api/orders',
      { schema: createOrderSchema },
      async (request, reply) => {
        const key = request.headers['idempotency-key'];
        if (typeof key !== 'string' || key.trim() === '') {
          return reply.code(400).send({ error: 'Idempotency-Key header is required' });
        }
        const result = await service.create(key, request.body);
        if (result.kind === 'conflict') {
          return reply.code(409).send({ code: 'IDEMPOTENCY_CONFLICT', message: result.message });
        }
        if (result.kind === 'not-found') {
          return reply.code(500).send({ error: 'unexpected' });
        }
        return reply
          .code(201)
          .header('Location', `/api/orders/${result.order.id}`)
          .send(represent(result.order));
      },
    );

    app.patch<{ Params: { id: string } }>('/api/orders/:id', async (request, reply) => {
      const target = readTargetStatus(request.body);
      if (!isOrderStatus(target) || (target !== 'CONFIRMED' && target !== 'SHIPPED')) {
        return reply.code(400).send({ message: 'status must be CONFIRMED or SHIPPED' });
      }
      const result = await service.changeStatus(request.params.id, target);
      if (result.kind === 'not-found') {
        return reply.code(404).send({ error: 'Order not found' });
      }
      if (result.kind === 'conflict') {
        return reply.code(409).send({ code: 'INVALID_TRANSITION', detail: result.message });
      }
      return reply.code(200).send(represent(result.order));
    });

    app.post<{ Params: { id: string } }>('/api/orders/:id/cancellations', async (request, reply) => {
      const result = await service.cancel(request.params.id);
      if (result.kind === 'not-found') {
        return reply.code(404).type('text/plain').send('Not found');
      }
      if (result.kind === 'conflict') {
        return reply.code(409).send({ message: result.message });
      }
      return reply.code(200).send(represent(result.order));
    });
  };
}
