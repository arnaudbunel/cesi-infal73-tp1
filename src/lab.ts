import type { Order } from './domain/order.js';

/**
 * Points d'injection de panne, utilisables UNIQUEMENT si buildApp({ labMode: true }).
 * Ils servent aux tests et aux expérimentations de laboratoire.
 */
export interface LabHooks {
  /** Appelé au début de chaque requête ; lever une exception simule une panne inattendue. */
  onRequest?: (request: { method: string; url: string; headers: Record<string, unknown> }) => void | Promise<void>;
  /** Point de synchronisation optionnel de la création, pour les expériences de laboratoire. */
  afterIdempotencyCheck?: (key: string) => void | Promise<void>;
  /** Appelé après l'écriture de la commande, avant la réponse (simuler un timeout ou une coupure). */
  afterMutation?: (order: Order) => void | Promise<void>;
}
