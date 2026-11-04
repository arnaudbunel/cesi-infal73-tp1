import type { NewOrderInput, Order, OrderStatus } from '../domain/order.js';

function seedOrder(id: string, status: OrderStatus, customerId: string, productId: string): Order {
  const date = '2026-01-01T09:00:00.000Z';
  return {
    id,
    customerId,
    items: [{ productId, quantity: 1 }],
    status,
    createdAt: date,
    updatedAt: date,
  };
}

/** Stockage en mémoire : chaque instance repart des mêmes données initiales. */
export class OrdersRepository {
  private readonly orders = new Map<string, Order>();
  private sequence = 105;

  constructor() {
    for (const order of [
      seedOrder('ORD-101', 'CREATED', 'C100', 'P1'),
      seedOrder('ORD-102', 'CONFIRMED', 'C101', 'P2'),
      seedOrder('ORD-103', 'SHIPPED', 'C102', 'P3'),
      seedOrder('ORD-104', 'CANCELLED', 'C103', 'P4'),
    ]) {
      this.orders.set(order.id, order);
    }
  }

  async findAll(): Promise<Order[]> {
    return [...this.orders.values()].map((o) => structuredClone(o));
  }

  async findById(id: string): Promise<Order | null> {
    const order = this.orders.get(id);
    return order ? structuredClone(order) : null;
  }

  async nextId(): Promise<string> {
    return `ORD-${this.sequence++}`;
  }

  async insert(id: string, input: NewOrderInput): Promise<Order> {
    const now = new Date().toISOString();
    const order: Order = {
      id,
      customerId: input.customerId,
      items: structuredClone(input.items),
      status: 'CREATED',
      createdAt: now,
      updatedAt: now,
    };
    this.orders.set(id, order);
    return structuredClone(order);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const order = this.orders.get(id);
    if (!order) return null;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    return structuredClone(order);
  }
}
