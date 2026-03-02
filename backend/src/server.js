import fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import fleetRoutes from './routes/fleet.js';
import weatherRoutes from './routes/weather.js';
import geocodeRoutes from './routes/geocode.js';

dotenv.config();

const server = fastify({ logger: true });

server.register(cors, {
  origin: '*',
});

server.register(fleetRoutes, { prefix: '/api/fleet' });
server.register(weatherRoutes, { prefix: '/api/weather' });
server.register(geocodeRoutes, { prefix: '/api/geocode' });

server.get('/health', async () => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await server.listen({ port: process.env.PORT || 3001, host: '0.0.0.0' });
    console.log(`Server listening on port ${process.env.PORT || 3001}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
