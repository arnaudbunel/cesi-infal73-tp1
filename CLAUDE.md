# CLAUDE.md — conventions du dépôt

## Projet
`order-service` : API REST de commandes (Node.js 24, TypeScript strict, Fastify 5), stockage en mémoire.

## Structure
- `src/app.ts` : `buildApp()`, importable par les tests ; ne démarre aucun serveur
- `src/server.ts` : démarrage HTTP
- `src/domain/` : types, statuts, règles de transition
- `src/routes/` : routes HTTP et représentations
- `src/services/` : logique applicative
- `src/repositories/` : accès aux données (mémoire)
- `src/schemas/` : JSON Schema
- `src/lab.ts` : points d'injection de panne, actifs seulement avec `labMode: true`
- `tests/` : `smoke.test.ts` (doit rester vert), `acceptance.test.ts` (contrat cible)

## Commandes
`npm ci`, `npm run dev`, `npm run build`, `npm run typecheck`, `npm test`, `npm run test:acceptance`

## Conventions
- TypeScript strict : pas de `any`, pas de `@ts-ignore`.
- Imports relatifs avec extension `.js` (ESM, NodeNext).
- Les tests utilisent `buildApp()` et `app.inject()` ; une instance neuve par test.
- Le mode laboratoire ne doit jamais être activé en production.
- Ajoutez des tests pour tout comportement que vous modifiez.
