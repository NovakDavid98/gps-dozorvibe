import axios from 'axios';
import { cache } from '../cache.js';

export default async function (fastify, opts) {
  const getAuthHeader = () => {
    const auth = Buffer.from(`${process.env.GPS_DOZOR_USER}:${process.env.GPS_DOZOR_PASS}`).toString('base64');
    return { Authorization: `Basic ${auth}` };
  };

  const apiClient = axios.create({
    baseURL: process.env.GPS_DOZOR_BASE_URL,
    headers: getAuthHeader()
  });

  fastify.get('/vehicles/group/:groupCode', async (request, reply) => {
    const { groupCode } = request.params;
    const cacheKey = `vehicles_${groupCode}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get(`/vehicles/group/${groupCode}`);
      // Cache vehicles for 30 seconds
      cache.set(cacheKey, response.data, 30);
      return response.data;
    } catch (error) {
      fastify.log.error(error);
      reply.status(error.response?.status || 500).send({ error: 'Failed to fetch vehicles' });
    }
  });

  fastify.get('/vehicle/:code/trips', async (request, reply) => {
    const { code } = request.params;
    const { from, to } = request.query;
    const cacheKey = `trips_${code}_${from}_${to}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get(`/vehicle/${code}/trips`, { params: { from, to } });
      // Cache trips for 5 minutes
      cache.set(cacheKey, response.data, 300);
      return response.data;
    } catch (error) {
      fastify.log.error(error);
      reply.status(error.response?.status || 500).send({ error: 'Failed to fetch trips' });
    }
  });

  fastify.get('/vehicles/history/:codes', async (request, reply) => {
    const { codes } = request.params;
    const { from, to } = request.query;
    const cacheKey = `history_${codes}_${from}_${to}`;

    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get(`/vehicles/history/${codes}`, { params: { from, to } });
      // Cache history for 10 minutes
      cache.set(cacheKey, response.data, 600);
      return response.data;
    } catch (error) {
      fastify.log.error(error);
      reply.status(error.response?.status || 500).send({ error: 'Failed to fetch history' });
    }
  });

  fastify.get('/groups/:groupCode/branches', async (request, reply) => {
    const { groupCode } = request.params;
    const cacheKey = `branches_${groupCode}`;

    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get(`/groups/${groupCode}/branches`);
      cache.set(cacheKey, response.data, 3600); // 1 hour
      return response.data;
    } catch (error) {
      fastify.log.error(error);
      reply.status(error.response?.status || 500).send({ error: 'Failed to fetch branches' });
    }
  });
}