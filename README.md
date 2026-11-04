# infal73-tp1 — order-service

TP INFAL73, Partie 2 : **Diagnostiquer et fiabiliser une API REST**
Master 1 MAALSI · groupes de 2 à 4 · environ 2 h 10.

Ce dépôt contient une API de commandes (`order-service`) qui fonctionne sur le parcours nominal, mais dont le comportement ne respecte pas encore entièrement le contrat décrit dans le sujet. Votre mission : **observer, diagnostiquer, corriger et prouver**. Les assistants IA sont autorisés ; générer du code ne suffit pas à valider le TP, il faut savoir expliquer, tester et justifier.

## Prérequis

- Node.js 24 LTS (`nvm use` lit le fichier `.nvmrc`)
- npm 10 ou supérieur
- Un client HTTP : `curl`, l'extension REST Client de VS Code (`docs/postman/requests.http`) ou Postman (`docs/postman/infal73-tp1.postman_collection.json`)

## Pile technique

Node.js 24, TypeScript strict, Fastify 5, JSON Schema (validation Fastify/Ajv), Node.js Test Runner lancé via `tsx --test`, `fastify.inject()` pour les tests.

## Commandes

```bash
npm ci                    # installation reproductible
npm run dev               # serveur en rechargement automatique
npm run build             # compilation vers dist/
npm start                 # exécute dist/server.js (après build)
npm run typecheck         # vérification TypeScript sans émission
npm test                  # tests de démarrage (smoke) : doivent être verts
npm run test:acceptance   # tests du contrat cible : des échecs sont attendus au départ
```

Le serveur écoute sur `http://127.0.0.1:3000` par défaut. Variables : `PORT`, `HOST` (voir `.env.example`, non chargé automatiquement : `PORT=3100 npm run dev`).

## Stockage en mémoire

Les commandes sont conservées en mémoire. Elles sont **réinitialisées à chaque redémarrage** du serveur, et chaque appel à `buildApp()` (utilisé par les tests) crée une application avec des données neuves. Il n'y a donc pas de script `reset` : relancez simplement le serveur.

Données initiales :

| Id | Statut |
|---|---|
| `ORD-101` | `CREATED` |
| `ORD-102` | `CONFIRMED` |
| `ORD-103` | `SHIPPED` |
| `ORD-104` | `CANCELLED` |

## Tester les cinq endpoints

```bash
# Lister
curl -i http://127.0.0.1:3000/api/orders

# Lire
curl -i http://127.0.0.1:3000/api/orders/ORD-101

# Créer
curl -i -X POST http://127.0.0.1:3000/api/orders \
  -H 'Content-Type: application/json' -H 'Idempotency-Key: demo-001' \
  -d '{"customerId":"C102","items":[{"productId":"P12","quantity":2}]}'

# Changer l'état (CONFIRMED ou SHIPPED)
curl -i -X PATCH http://127.0.0.1:3000/api/orders/ORD-101 \
  -H 'Content-Type: application/json' -d '{"status":"CONFIRMED"}'

# Annuler
curl -i -X POST http://127.0.0.1:3000/api/orders/ORD-102/cancellations
```

## Contrat et règles métier

Consultez le sujet remis en séance : contrat HTTP cible, matrice des transitions, matrice de tests T1 à T8. Ce dépôt ne les reproduit pas.

## Méthode : prédiction / observation / explication

Avant d'exécuter une requête ou un test, consignez dans `docs/student-notes-template.md` (copiez-le) :

1. **Prédiction** : ce que vous attendez (statut, en-têtes, corps) et pourquoi ;
2. **Observation** : la requête exacte et la réponse réellement reçue ;
3. **Explication** : l'écart éventuel, et l'endroit du code qui en est responsable.

Une capture d'écran seule n'est pas une preuve : conservez requêtes, statuts, corps et sorties de tests.

## Mode laboratoire

Pour simuler des pannes, `buildApp({ labMode: true, lab: { ... } })` accepte des points d'injection (voir `src/lab.ts`). Ils ne sont actifs que si `labMode` est explicitement demandé et sont refusés quand `NODE_ENV=production`. Le serveur peut aussi être lancé avec `LAB_MODE=1 npm run dev` : l'en-tête `X-Lab-Fault: throw` déclenche alors une exception interne. Aucune route de laboratoire n'existe.

## Limites pédagogiques

- Pas d'authentification, de paiement, de stock ni de broker.
- Stockage mémoire : rien ne survit à un redémarrage, et deux instances ne partagent rien.
- Les liens `_links` suivent un format personnalisé, qui n'est pas HAL.
- Les tests fournis ne couvrent pas tout : à vous d'en ajouter pour prouver vos corrections.

## Extensions facultatives

- Persister commandes et clés d'idempotence dans PostgreSQL, avec contrainte d'unicité.
- Documenter l'API avec OpenAPI et discuter les limites du format `_links`.
- Ajouter des tests de concurrence et comparer une instance et plusieurs instances.

## Usage de l'IA

Indiquez dans votre fichier de résultats ce qui a été généré ou suggéré par une IA.
