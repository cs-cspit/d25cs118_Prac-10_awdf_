// Sends GET /api/tasks N times and prints a timing table - the same thing as
// reading Postman's "Time" field, but repeatable. Start the server first.
//
//   npm run benchmark                  (5 requests)
//   npm run benchmark -- 10            (10 requests)
//
// Run once with CACHE_ENABLED=true and once with CACHE_ENABLED=false in .env
// (restart the server in between) to get the cached vs uncached readings.
import 'dotenv/config';

const BASE = `http://localhost:${process.env.PORT || 5000}/api`;
const runs = Number(process.argv[2]) || 5;

const json = (body) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

const login = await fetch(`${BASE}/auth/login`, json({ email: 'demo@example.com', password: 'password123' }));
if (!login.ok) {
  console.error('Login failed - run "npm run seed" first and make sure the server is running.');
  process.exit(1);
}
const { token } = await login.json();
const auth = { headers: { Authorization: `Bearer ${token}` } };

// Start from an empty cache so request #1 is a genuine MISS
await fetch(`${BASE}/cache`, { method: 'DELETE', ...auth });

const rows = [];
for (let i = 1; i <= runs; i++) {
  const start = performance.now();
  const res = await fetch(`${BASE}/tasks`, auth);
  const body = await res.json();
  const total = performance.now() - start;

  rows.push({
    request: i,
    'X-Cache': res.headers.get('x-cache'),
    'server time': res.headers.get('x-response-time'),
    'total time (ms)': Number(total.toFixed(2)),
    tasks: body.length
  });
}

console.table(rows);

const stats = await (await fetch(`${BASE}/cache/stats`, auth)).json();
console.log(`Cache enabled: ${stats.enabled} | hits: ${stats.hits} | misses: ${stats.misses} | hit rate: ${stats.hitRate}`);
