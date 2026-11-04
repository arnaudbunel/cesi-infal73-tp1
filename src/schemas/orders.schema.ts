export interface CreateOrderBody {
  customerId: string;
  items: { productId: string; quantity: number }[];
}

export const createOrderSchema = {
  body: {
    type: 'object',
    required: ['customerId', 'items'],
    additionalProperties: false,
    properties: {
      customerId: { type: 'string', minLength: 1 },
      items: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['productId', 'quantity'],
          additionalProperties: false,
          properties: {
            productId: { type: 'string', minLength: 1 },
            quantity: { type: 'integer' },
          },
        },
      },
    },
  },
} as const;
