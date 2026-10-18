# Event-driven notifications: timing evidence

Measured on 18 Oct 2026 with `npm run demo:events` (local MongoDB, `NOTIFY_DELAY_MS=2000`).

## Async mode (EventEmitter, default)

```

Server says: notification queued - handled by the task-created listener
┌─────────┬─────────────────────────────┬────────┬────────────────────────────┬────────────────────────────┬───────────┐
│ (index) │ title                       │ status │ request sent               │ response at                │ time (ms) │
├─────────┼─────────────────────────────┼────────┼────────────────────────────┼────────────────────────────┼───────────┤
│ 0       │ 'Prepare event-driven demo' │ 201    │ '2026-10-18T11:00:41.417Z' │ '2026-10-18T11:00:41.439Z' │ 23.5      │
│ 1       │ 'Review EventEmitter docs'  │ 201    │ '2026-10-18T11:00:41.442Z' │ '2026-10-18T11:00:41.450Z' │ 10.3      │
│ 2       │ 'Broken notifier #fail'     │ 201    │ '2026-10-18T11:00:41.452Z' │ '2026-10-18T11:00:41.460Z' │ 10.5      │
└─────────┴─────────────────────────────┴────────┴────────────────────────────┴────────────────────────────┴───────────┘
Notifications right after the responses: 0
Notifications 2700 ms later: 2
  2026-10-18T11:00:43.447Z  Task "Prepare event-driven demo" (priority: high) created for Demo User <demo@example.com>
  2026-10-18T11:00:43.462Z  Task "Review EventEmitter docs" (priority: medium) created for Demo User <demo@example.com>
("#fail" task: API still returned 201; its listener error went to the 'error' listener)
```

Server log:

```
MongoDB Connected: 127.0.0.1
Event listeners registered: task-created, task-updated, task-deleted, error
Server running on port 5000
Cache ENABLED (TTL 60s)
Notifications: ASYNC via EventEmitter, simulated delay 2000 ms
[2026-10-18T11:00:41.420Z] POST /api/tasks
Task created with ID: 6ad4a6d9bcf52d953754b908
Cache invalidated: all_tasks:6ad4a68eed5f22c4e894584b (0 removed)
[API] Response sent at          2026-10-18T11:00:41.439Z  (201 for "Prepare event-driven demo")
[Listener] task-created received at   2026-10-18T11:00:41.440Z  (emitted at 2026-10-18T11:00:41.440Z)
[2026-10-18T11:00:41.445Z] POST /api/tasks
Task created with ID: 6ad4a6d9bcf52d953754b90b
Cache invalidated: all_tasks:6ad4a68eed5f22c4e894584b (0 removed)
[API] Response sent at          2026-10-18T11:00:41.450Z  (201 for "Review EventEmitter docs")
[Listener] task-created received at   2026-10-18T11:00:41.451Z  (emitted at 2026-10-18T11:00:41.451Z)
[2026-10-18T11:00:41.457Z] POST /api/tasks
Task created with ID: 6ad4a6d9bcf52d953754b90e
Cache invalidated: all_tasks:6ad4a68eed5f22c4e894584b (0 removed)
[API] Response sent at          2026-10-18T11:00:41.460Z  (201 for "Broken notifier #fail")
[Listener] task-created received at   2026-10-18T11:00:41.461Z  (emitted at 2026-10-18T11:00:41.461Z)
[Event Error] Notification service unavailable for task "Broken notifier #fail" - caught by the 'error' listener at 2026-10-18T11:00:41.462Z; server keeps running
[Notification] Task "Prepare event-driven demo" (priority: high) created for Demo User <demo@example.com>
[Listener] task-created finished at   2026-10-18T11:00:43.447Z  (+2000 ms simulated delay)
[Notification] Task "Review EventEmitter docs" (priority: medium) created for Demo User <demo@example.com>
[Listener] task-created finished at   2026-10-18T11:00:43.462Z  (+2000 ms simulated delay)
[2026-10-18T11:00:44.578Z] GET /api/tasks
Cache MISS - fetched 7 tasks from MongoDB for user 6ad4a68eed5f22c4e894584b
[2026-10-18T11:00:44.714Z] PUT /api/tasks/6ad4a6d9bcf52d953754b90b
Task updated with ID: 6ad4a6d9bcf52d953754b90b
Cache invalidated: all_tasks:6ad4a68eed5f22c4e894584b, task:6ad4a68eed5f22c4e894584b:6ad4a6d9bcf52d953754b90b (1 removed)
[Update] Task "Review EventEmitter docs" was updated (now completed) at 2026-10-18T11:00:44.738Z
[2026-10-18T11:00:44.834Z] DELETE /api/tasks/6ad4a6d9bcf52d953754b90b
Task deleted with ID: 6ad4a6d9bcf52d953754b90b
Cache invalidated: all_tasks:6ad4a68eed5f22c4e894584b, task:6ad4a68eed5f22c4e894584b:6ad4a6d9bcf52d953754b90b (0 removed)
[Cleanup] Task "Review EventEmitter docs" was deleted by demo@example.com at 2026-10-18T11:00:44.839Z
```

## Sync mode (notification inside the route, comparison only)

```

Server says: notification sent inline before responding (sync mode)
┌─────────┬─────────────────────────────┬────────┬────────────────────────────┬────────────────────────────┬───────────┐
│ (index) │ title                       │ status │ request sent               │ response at                │ time (ms) │
├─────────┼─────────────────────────────┼────────┼────────────────────────────┼────────────────────────────┼───────────┤
│ 0       │ 'Prepare event-driven demo' │ 201    │ '2026-10-18T11:00:20.894Z' │ '2026-10-18T11:00:22.932Z' │ 2037      │
│ 1       │ 'Review EventEmitter docs'  │ 201    │ '2026-10-18T11:00:22.933Z' │ '2026-10-18T11:00:24.950Z' │ 2019      │
│ 2       │ 'Broken notifier #fail'     │ 201    │ '2026-10-18T11:00:24.952Z' │ '2026-10-18T11:00:24.960Z' │ 9.1       │
└─────────┴─────────────────────────────┴────────┴────────────────────────────┴────────────────────────────┴───────────┘
Notifications right after the responses: 2
Notifications 2700 ms later: 2
  2026-10-18T11:00:22.931Z  Task "Prepare event-driven demo" (priority: high) created for Demo User <demo@example.com>
  2026-10-18T11:00:24.950Z  Task "Review EventEmitter docs" (priority: medium) created for Demo User <demo@example.com>
("#fail" task: the error was caught inside the route - see the server log)
```

Server log:

```
MongoDB Connected: 127.0.0.1
Event listeners registered: task-created, task-updated, task-deleted, error
Server running on port 5000
Cache ENABLED (TTL 60s)
Notifications: SYNC (inline, for comparison), simulated delay 2000 ms
Task created with ID: 6ad4a6c4ee64e0a34c63e65f
Cache invalidated: all_tasks:6ad4a68eed5f22c4e894584b (0 removed)
[Listener] task-created received at   2026-10-18T11:00:20.919Z  (emitted at inline (sync mode))
[Notification] Task "Prepare event-driven demo" (priority: high) created for Demo User <demo@example.com>
[Listener] task-created finished at   2026-10-18T11:00:22.932Z  (+2000 ms simulated delay)
[API] Response sent at          2026-10-18T11:00:22.932Z  (201 for "Prepare event-driven demo")
Task created with ID: 6ad4a6c6ee64e0a34c63e662
Cache invalidated: all_tasks:6ad4a68eed5f22c4e894584b (0 removed)
[Listener] task-created received at   2026-10-18T11:00:22.940Z  (emitted at inline (sync mode))
[Notification] Task "Review EventEmitter docs" (priority: medium) created for Demo User <demo@example.com>
[Listener] task-created finished at   2026-10-18T11:00:24.950Z  (+2000 ms simulated delay)
[API] Response sent at          2026-10-18T11:00:24.950Z  (201 for "Review EventEmitter docs")
Task created with ID: 6ad4a6c8ee64e0a34c63e665
Cache invalidated: all_tasks:6ad4a68eed5f22c4e894584b (0 removed)
[Listener] task-created received at   2026-10-18T11:00:24.960Z  (emitted at inline (sync mode))
[Sync Notification Error] Notification service unavailable for task "Broken notifier #fail"
[API] Response sent at          2026-10-18T11:00:24.960Z  (201 for "Broken notifier #fail")
```
