import { buildApp } from './app.js';

const port = Number(process.env['PORT'] ?? 3000);
const host = process.env['HOST'] ?? '127.0.0.1';

// Mode laboratoire optionnel, refusé en production : LAB_MODE=1 npm run dev
// Il ajoute seulement un déclencheur de panne (en-tête X-Lab-Fault: throw), aucune route.
const labMode = process.env['LAB_MODE'] === '1';

const app = buildApp({
  logger: true,
  labMode,
  ...(labMode && {
    lab: {
      onRequest: (request) => {
        if (request.headers['x-lab-fault'] === 'throw') {
          throw new Error('Simulated unexpected failure');
        }
      },
    },
  }),
});

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
