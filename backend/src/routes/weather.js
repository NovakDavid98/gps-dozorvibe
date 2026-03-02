import axios from 'axios';
import { cache } from '../cache.js';

export default async function (fastify, opts) {
  fastify.get('/history', async (request, reply) => {
    const { latitude, longitude, start_date, end_date } = request.query;
    const cacheKey = `weather_${latitude}_${longitude}_${start_date}_${end_date}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      // Note: open-meteo historical API
      const response = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
        params: {
          latitude,
          longitude,
          start_date,
          end_date,
          hourly: 'temperature_2m,precipitation'
        }
      });
      // Cache weather for 1 hour
      cache.set(cacheKey, response.data, 3600);
      return response.data;
    } catch (error) {
      fastify.log.error(error);
      reply.status(error.response?.status || 500).send({ error: 'Failed to fetch weather' });
    }
  });
}