# Practical 9 — In-Memory Caching and Query Optimization

**Student:** D25CS118 · **Subject:** Advanced Web Development Frameworks (ITUE301)

Continues from **Practicals 7–8** (Task Manager with JWT auth + lazy-loaded React UI).
This practical adds server-side caching with **node-cache**.

📄 **Measurements:** [docs/cache-benchmark.md](docs/cache-benchmark.md)

## Run locally

```bash
npm install
cp .env.example .env        # set JWT_SECRET; CACHE_ENABLED / CACHE_TTL are optional
npm run seed                # demo@example.com / password123 with 2000 tasks
npm run server              # Express :5000 (MongoDB must be running)
npm run dev                 # React :5173
npm run benchmark           # in a third terminal: prints the timing table
```

## Flow

```
GET /api/tasks
   → protect (JWT) → cache.get('all_tasks:<userId>')
        ├── HIT  → return cached list            (X-Cache: HIT)
        └── MISS → Task.find().sort().lean()     (X-Cache: MISS)
                   → cache.set(key, tasks, 60s) → return

POST / PUT / DELETE /api/tasks
   → write to MongoDB → cache.del(['all_tasks:<userId>', 'task:<userId>:<id>'])
```

## Files

| File | Purpose |
|---|---|
| `server/config/cache.js` | Shared `NodeCache` instance (`stdTTL` 60 s), key helpers, `invalidateTasks()` |
| `server/routes/taskRoutes.js` | Cache check on `GET /` and `GET /:id`; invalidation after every successful write |
| `server/routes/cacheRoutes.js` | `GET /api/cache/stats` (hits, misses, hit rate, keys + TTL left), `DELETE /api/cache` |
| `server/middleware/responseTime.js` | Adds `X-Response-Time` header |
| `server/models/Task.js` | Compound index `{ user: 1, createdAt: -1 }` for the list query |
| `server/scripts/seed.js` | Inserts many tasks so the difference is measurable |
| `server/scripts/benchmark.js` | Repeats `GET /api/tasks` and prints a timing table |

## Design notes

- **Cache key is per user** (`all_tasks:<userId>`) because each user sees only their own
  tasks — a single global `all_tasks` key would leak one user's tasks to another.
- **Single task cached separately** (`task:<userId>:<id>`), and invalidated on PUT/DELETE
  of that task.
- **`lean()`** returns plain objects: faster than full Mongoose documents and safe to keep
  in the cache (`useClones: false` avoids a deep copy on every hit).
- **`CACHE_ENABLED=false`** gives the uncached baseline without commenting code out.

## Results (2000 tasks)

| | Uncached avg | Cached (HIT) avg |
|---|---|---|
| Server time | 39.52 ms | **11.14 ms** |
| Total time | 46.37 ms | **17.51 ms** |

## Key questions

1. **Why invalidate on every write?** The cache holds a copy of the list. After a
   POST/PUT/DELETE that copy no longer matches MongoDB; without `cache.del` users would
   keep seeing the old list (missing new tasks, showing deleted ones) until the TTL expires.
2. **Reasonable TTL?** ~60 s. Writes already invalidate immediately, so TTL is only a
   safety net against changes the server does not see. Longer TTL = more hits but a bigger
   window for stale data; shorter TTL = fresher but more DB load.
3. **Why not for multiple servers?** node-cache lives in one Node process's RAM. With
   several instances behind a load balancer, a write handled by server A clears only A's
   cache — server B keeps serving its stale copy. Each instance also warms its own cache
   separately, and everything is lost on restart. A shared cache such as **Redis** solves this.

## Known limitation

The cache is in-memory, so restarting the server empties it (the first request after a
restart is always a MISS). This is expected behaviour for node-cache.
