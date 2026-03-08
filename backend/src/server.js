import fastify from 'fastify';
import cors from '@fastify/cors';
import staticFiles from '@fastify/static';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import fleetRoutes from './routes/fleet.js';
import weatherRoutes from './routes/weather.js';
import geocodeRoutes from './routes/geocode.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const server = fastify({ logger: true });

server.register(cors, { origin: '*' });

server.register(fleetRoutes, { prefix: '/api/fleet' });
server.register(weatherRoutes, { prefix: '/api/weather' });
server.register(geocodeRoutes, { prefix: '/api/geocode' });

server.get('/health', async () => {
  return { status: 'ok' };
});

// Serve the production frontend build when it exists.
// In development the Vite dev server handles this instead.
const distPath = join(__dirname, '../../frontend/dist');
server.register(staticFiles, {
  root: distPath,
  prefix: '/',
  // Send index.html for any unmatched route so Vue Router history mode works.
  wildcard: false,
}).then(() => {
  server.setNotFoundHandler((_req, reply) => {
    reply.sendFile('index.html', distPath);
  });
}).catch(() => {
  // dist does not exist yet (dev mode) — silently skip static serving.
});

const start = async () => {
  try {
    await server.listen({ port: Number(process.env.PORT) || 3001, host: '0.0.0.0' });
    console.log(`Server listening on port ${process.env.PORT || 3001}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
