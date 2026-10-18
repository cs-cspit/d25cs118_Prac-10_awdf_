// Creates tasks through the API and shows that the 201 arrives before the
// background notification finishes. Start the server first.
//
//   npm run demo:events
//
// Run once with NOTIFY_MODE=async (default) and once with NOTIFY_MODE=sync in
// .env (restart the server in between) to compare the response times.
import 'dotenv/config';

const BASE = `http://localhost:${process.env.PORT || 5000}/api`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const json = (body, token) => ({
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  },
  body: JSON.stringify(body)
});

const login = await fetch(`${BASE}/auth/login`, json({ email: 'demo@example.com', password: 'password123' }));
if (!login.ok) {
  console.error('Login failed - run "npm run seed" first and make sure the server is running.');
  process.exit(1);
}
const { token } = await login.json();
const auth = { headers: { Authorization: `Bearer ${token}` } };

await fetch(`${BASE}/notifications`, { method: 'DELETE', ...auth });

let serverMode = '';
const create = async (title, priority) => {
  const sentAt = new Date().toISOString();
  const start = performance.now();
  const res = await fetch(`${BASE}/tasks`, json({ title, priority }, token));
  const body = await res.json();
  const ms = performance.now() - start;
  serverMode = body.notification;
  return { title, status: res.status, 'request sent': sentAt, 'response at': body.respondedAt, 'time (ms)': Number(ms.toFixed(1)) };
};

const rows = [];
rows.push(await create('Prepare event-driven demo', 'high'));
rows.push(await create('Review EventEmitter docs', 'medium'));
rows.push(await create('Broken notifier #fail', 'low'));

const sync = serverMode.includes('sync');
console.log(`\nServer says: notification ${serverMode}`);
console.table(rows);

const countNow = (await (await fetch(`${BASE}/notifications`, auth)).json()).length;
console.log(`Notifications right after the responses: ${countNow}`);

const wait = Number(process.env.NOTIFY_DELAY_MS ?? 2000) + 700;
await sleep(wait);
const later = await (await fetch(`${BASE}/notifications`, auth)).json();
console.log(`Notifications ${wait} ms later: ${later.length}`);
for (const n of later.filter((x) => x.type === 'task-created').reverse()) {
  console.log(`  ${n.at}  ${n.message}`);
}
console.log(sync
  ? '("#fail" task: the error was caught inside the route - see the server log)'
  : '("#fail" task: API still returned 201; its listener error went to the \'error\' listener)');
