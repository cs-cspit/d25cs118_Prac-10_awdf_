import express from 'express';
import cache, { isCacheEnabled } from '../config/cache.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// GET /api/cache/stats - debug endpoint: hit / miss counters and stored keys
router.get('/stats', (req, res) => {
  const { hits, misses, keys, ksize, vsize } = cache.getStats();
  const total = hits + misses;

  res.status(200).json({
    enabled: isCacheEnabled(),
    ttlSeconds: cache.options.stdTTL,
    hits,
    misses,
    hitRate: total ? `${((hits / total) * 100).toFixed(1)}%` : '0%',
    keyCount: keys,
    approxSizeBytes: ksize + vsize,
    keys: cache.keys().map((key) => ({
      key,
      expiresInSeconds: Math.max(0, Math.round((cache.getTtl(key) - Date.now()) / 1000))
    }))
  });
});

// DELETE /api/cache - flush everything and reset the counters
router.delete('/', (req, res) => {
  cache.flushAll();
  cache.flushStats();
  res.status(200).json({ message: 'Cache flushed and stats reset' });
});

export default router;
