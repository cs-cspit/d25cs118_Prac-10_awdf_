# Practical 10 — Asynchronous Processing with Event-Driven Architecture

**Student:** D25CS118 · **Subject:** Advanced Web Development Frameworks (ITUE301)

Continues from **Practicals 7–9** (Task Manager with JWT auth, lazy-loaded React UI and node-cache).
This practical adds a background notification system using Node's built-in **EventEmitter**,
with no message queue or extra dependency.

📄 **Timing evidence:** [docs/event-timing.md](docs/event-timing.md)

## Run locally

```bash
npm install
cp .env.example .env        # set JWT_SECRET; NOTIFY_MODE / NOTIFY_DELAY_MS are optional
npm run seed                # demo@example.com / password123
npm run server              # Express :5000 (MongoDB must be running)
npm run dev                 # React :5173
npm run demo:events         # in a third terminal: creates 3 tasks and prints the timings
```

## Flow

```
POST /api/tasks
   → protect (JWT) → validate → Task.create() → invalidate cache
   → console.log('[API] Response sent at …') → res.status(201).json(…)
   → taskEvents.emit('task-created', { task, user, emittedAt })   ← after the response
                         │
                         ▼   (event loop, client already has its 201)
        task-created listener: look up user name → 2 s simulated e-mail → log [Notification]

PUT    /api/tasks/:id  → emit('task-updated')  → [Update]  listener
DELETE /api/tasks/:id  → emit('task-deleted')  → [Cleanup] listener
error thrown in any async listener → 'error' listener (captureRejections) → server keeps running
```

## Files

| File | Purpose |
|---|---|
| `server/events/taskEvents.js` | `class TaskEvents extends EventEmitter`, one shared instance (`captureRejections: true`) and the event names |
| `server/events/listeners.js` | `task-created` (async, 2 s delay), `task-updated`, `task-deleted` and `error` listeners; `registerListeners()` |
| `server/events/notificationStore.js` | Last 20 notifications per user, in memory |
| `server/routes/taskRoutes.js` | Logs the response timestamp, sends the response, **then** emits |
| `server/routes/notificationRoutes.js` | `GET /api/notifications`, `DELETE /api/notifications` |
| `server/app.js` | Calls `registerListeners()` once at start-up, before any request |
| `server/scripts/eventDemo.js` | Creates tasks, times each request and checks when the notifications appear |
| `src/components/NotificationPanel.jsx` | Lazy-loaded panel on the Tasks page that shows the listener output |

## Results

| Mode | POST /api/tasks response time | Notification |
|---|---|---|
| `NOTIFY_MODE=async` (EventEmitter) | **10–24 ms** | appears ~2 s later, in the background |
| `NOTIFY_MODE=sync` (inline in route) | **~2020–2040 ms** | done before the response |

In async mode the server log shows `[API] Response sent at …` **before**
`[Listener] task-created finished at …` for every task (see the timing doc).

## Answers to the key questions

- **Why doesn't `emit()` block the response?** `emit()` calls the listeners synchronously,
  but the `task-created` listener is `async`: it runs until its first `await` and then returns
  a pending promise. The slow part (database lookup, 2 s timer) is finished later by the
  event loop. The response has already been sent at that point because `res.json()` runs before
  `emit()`.
- **What if the notification code were inside the POST route?** The client would wait for it.
  With `NOTIFY_MODE=sync` every create takes about 2 s instead of about 10 ms.
- **Why EventEmitter here but not at production scale?** The events live in one process's
  memory. They are lost if the process crashes or restarts, they can't be shared between several
  server instances, and nothing retries them. Millions of events a day need a durable queue
  (RabbitMQ, Kafka, BullMQ/Redis) with retries and back-pressure.
- **Link to Practical 9:** caching and events both take work off the critical request path:
  caching avoids repeated database reads, and events defer side effects.

## Post-lab tasks done

- `task-deleted` event with its own listener and message (`[Cleanup] …`), plus `task-updated`.
- `'error'` listener that catches errors thrown inside the `task-created` handler. A task
  whose title contains `#fail` triggers it; the API still returns 201 and the server keeps running.
- Slow handler simulated with a 2 s `setTimeout`; the API still responds instantly.
