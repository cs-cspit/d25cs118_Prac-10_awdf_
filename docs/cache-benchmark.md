# Practical 9 — Response Time: Cached vs Uncached

**Setup:** 2000 seeded tasks (`npm run seed`), local MongoDB, Node v24, `GET /api/tasks`
as the demo user. Measured with `npm run benchmark` (same as Postman's *Time* field).
*Server time* = `X-Response-Time` header (time spent inside Express, no network).

## Uncached — `CACHE_ENABLED=false` (every request queries MongoDB)

| Request | X-Cache | Server time | Total time |
|---|---|---|---|
| 1 | DISABLED | 57.64 ms | 65.82 ms |
| 2 | DISABLED | 37.15 ms | 45.43 ms |
| 3 | DISABLED | 33.21 ms | 38.41 ms |
| 4 | DISABLED | 30.61 ms | 36.87 ms |
| 5 | DISABLED | 39.01 ms | 45.34 ms |
| **Avg** | | **39.52 ms** | **46.37 ms** |

## Cached — `CACHE_ENABLED=true`, TTL 60 s

| Request | X-Cache | Server time | Total time |
|---|---|---|---|
| 1 | MISS | 83.90 ms | 92.55 ms |
| 2 | HIT | 11.23 ms | 18.81 ms |
| 3 | HIT | 10.86 ms | 17.20 ms |
| 4 | HIT | 10.15 ms | 15.86 ms |
| 5 | HIT | 12.30 ms | 18.16 ms |
| **Avg (HITs)** | | **11.14 ms** | **17.51 ms** |

Hit rate after the run: 4 hits / 1 miss = 80 %.

## Result

- Cache HIT is about **3.5× faster** in server time (39.5 ms → 11.1 ms) and
  **2.6× faster** end-to-end (46.4 ms → 17.5 ms).
- The first request after start / after a write is a MISS and is slightly slower than an
  uncached request, because it also stores the result.
- The remaining ~11 ms on a HIT is mostly JSON serialization of 2000 tasks (~400 kB); the
  MongoDB round trip is gone entirely.

## Invalidation check

| Step | X-Cache | Result |
|---|---|---|
| GET /tasks | HIT | 2000 tasks |
| POST /tasks "New after cache" → GET /tasks | **MISS** | 2001 tasks, new task first ✔ |
| GET /tasks/:id twice | MISS, HIT | single task cached under its own key ✔ |
| PUT /tasks/:id "Renamed" → GET /tasks/:id | **MISS** | title = "Renamed" ✔ |
| DELETE /tasks/:id → GET /tasks | **MISS** | 2000 tasks ✔ |

No stale data was returned after any write.

## Postman readings (fill in for the lab journal)

| Reading | Uncached (ms) | Cached (ms) |
|---|---|---|
| 1 | | |
| 2 | | |
| 3 | | |

## TTL experiment

| TTL | Effect |
|---|---|
| 5 s | Cache expires between most manual Postman clicks → mostly MISS, little benefit |
| 60 s (chosen) | Repeated reads during normal use are HITs; writes still invalidate immediately |
| 600 s | Highest hit rate, but if a write ever bypassed invalidation (e.g. another server, direct DB edit) stale data could live 10 minutes |

Change `CACHE_TTL` in `.env`, restart, and re-run `npm run benchmark` to compare.
