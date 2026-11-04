import { canTransition } from '../domain/order.js';
import type { NewOrderInput, Order, OrderStatus } from '../domain/order.js';
import type { LabHooks } from '../lab.js';
import type { OrdersRepository } from '../repositories/orders.repository.js';

export type OrderResult =
  | { kind: 'ok'; order: Order }
  | { kind: 'not-found' }
  | { kind: 'conflict'; message: string };

interface InFlightCreation {
  fingerprint: string;
  result: Promise<Order>;
}

export class OrdersService {
  private readonly inFlight = new Map<string, InFlightCreation>();

  constructor(
    private readonly repository: OrdersRepository,
    private readonly lab: LabHooks = {},
  ) {}

  list(): Promise<Order[]> {
    return this.repository.findAll();
  }

  get(id: string): Promise<Order | null> {
    return this.repository.findById(id);
  }

  async create(key: string, input: NewOrderInput): Promise<OrderResult> {
    const fingerprint = JSON.stringify(input);

    const known = this.inFlight.get(key);
    if (known) {
      if (known.fingerprint !== fingerprint) {
        return { kind: 'conflict', message: 'Idempotency-Key already used with another payload' };
      }
      return { kind: 'ok', order: await known.result };
    }

    await this.lab.afterIdempotencyCheck?.(key);

    const id = await this.repository.nextId();
    this.inFlight.set(key, { fingerprint, result: this.repository.insert(id, input) });

    try {
      const order = await this.inFlight.get(key)!.result;
      await this.lab.afterMutation?.(order);
      return { kind: 'ok', order };
    } finally {
      this.inFlight.delete(key);
    }
  }

  async changeStatus(id: string, target: OrderStatus): Promise<OrderResult> {
    const order = await this.repository.findById(id);
    if (!order) return { kind: 'not-found' };
    if (!canTransition(order.status, target)) {
      return { kind: 'conflict', message: `Cannot move order from ${order.status} to ${target}` };
    }
    const updated = await this.repository.updateStatus(id, target);
    return updated ? { kind: 'ok', order: updated } : { kind: 'not-found' };
  }

  async cancel(id: string): Promise<OrderResult> {
    const order = await this.repository.findById(id);
    if (!order) return { kind: 'not-found' };
    if (order.status === 'CANCELLED') {
      return { kind: 'conflict', message: `Order ${id} is already cancelled` };
    }
    const updated = await this.repository.updateStatus(id, 'CANCELLED');
    return updated ? { kind: 'ok', order: updated } : { kind: 'not-found' };
  }
}
