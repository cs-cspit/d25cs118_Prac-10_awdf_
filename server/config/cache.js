import NodeCache from 'node-cache';

// Shared in-memory cache instance (one per Node process).
// stdTTL: entries expire after CACHE_TTL seconds (default 60).
// checkperiod: how often expired keys are swept from memory.
// useClones: false - we cache plain (lean) objects and never mutate them,
// so skipping the deep clone on every get/set keeps cache hits fast.
const cache = new NodeCache({
  stdTTL: Number(process.env.CACHE_TTL) || 60,
  checkperiod: 120,
  useClones: false
});

// Set CACHE_ENABLED=false in .env to measure the uncached baseline
// without commenting out code.
export const isCacheEnabled = () => process.env.CACHE_ENABLED !== 'false';

// Tasks are per user, so the user id is part of every key.
// Stable keys = the same request always maps to the same cache entry.
export const allTasksKey = (userId) => `all_tasks:${userId}`;
export const taskKey = (userId, taskId) => `task:${userId}:${taskId}`;

// Remove every cached view that a write to this user's tasks can make stale
export const invalidateTasks = (userId, taskId) => {
  const keys = [allTasksKey(userId)];
  if (taskId) keys.push(taskKey(userId, taskId));
  const removed = cache.del(keys);
  console.log(`Cache invalidated: ${keys.join(', ')} (${removed} removed)`);
};

export default cache;
