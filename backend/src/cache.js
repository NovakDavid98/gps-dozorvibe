import NodeCache from 'node-cache';

// Standard cache instance with a default TTL of 60 seconds
export const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
