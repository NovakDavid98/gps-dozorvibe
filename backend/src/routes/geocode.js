import axios from 'axios';
import { cache } from '../cache.js';

export default async function (fastify, opts) {
  fastify.get('/reverse', async (request, reply) => {
    const { lat, lon } = request.query;
    const cacheKey = `geocode_${lat}_${lon}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat,
          lon,
          format: 'json',
          addressdetails: 1
        },
        headers: {
          // Nominatim requires User-Agent
          'User-Agent': 'FleetPulse/1.0 (david@example.com)'
        }
      });
      
      // Cache geocode heavily as it doesn't change
      cache.set(cacheKey, response.data, 86400); // 24 hours
      return response.data;
    } catch (error) {
      fastify.log.error(error);
      reply.status(error.response?.status || 500).send({ error: 'Failed to fetch geocoding' });
    }
  });
}