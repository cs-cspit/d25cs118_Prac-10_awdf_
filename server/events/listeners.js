import taskEvents, { TASK_CREATED, TASK_DELETED, TASK_UPDATED } from './taskEvents.js';
import User from '../models/User.js';
import { addNotification } from './notificationStore.js';

// Simulated slow notification work (e.g. sending an e-mail). Default 2 s.
const NOTIFY_DELAY_MS = Number(process.env.NOTIFY_DELAY_MS ?? 2000);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const now = () => new Date().toISOString();

// Looks up the user's name - real async work done in the background,
// not on the request path.
const describeUser = async (userId, fallbackEmail) => {
  const user = await User.findById(userId).select('name email').lean();
  return user ? `${user.name} <${user.email}>` : fallbackEmail;
};

// The notification job itself. Exported so the NOTIFY_MODE=sync comparison
// in taskRoutes.js can run exactly the same work inline.
export const sendCreatedNotification = async ({ task, user, emittedAt }) => {
  console.log(`[Listener] task-created received at   ${now()}  (emitted at ${emittedAt})`);

  // Deliberate failure path for the 'error' listener demo
  if (task.title.toLowerCase().includes('#fail')) {
    throw new Error(`Notification service unavailable for task "${task.title}"`);
  }

  const assignedTo = await describeUser(user.id, user.email);
  await sleep(NOTIFY_DELAY_MS);

  const message = `Task "${task.title}" (priority: ${task.priority}) created for ${assignedTo}`;
  addNotification(user.id, { type: TASK_CREATED, message, taskId: String(task._id) });
  console.log(`[Notification] ${message}`);
  console.log(`[Listener] task-created finished at   ${now()}  (+${NOTIFY_DELAY_MS} ms simulated delay)`);
};

// Register every listener once, at server start-up (imported from app.js).
// A listener added after emit() would silently miss the event.
export const registerListeners = () => {
  taskEvents.on(TASK_CREATED, sendCreatedNotification);

  taskEvents.on(TASK_UPDATED, ({ task, user }) => {
    const state = task.completed ? 'completed' : 'pending';
    const message = `Task "${task.title}" was updated (now ${state})`;
    addNotification(user.id, { type: TASK_UPDATED, message, taskId: String(task._id) });
    console.log(`[Update] ${message} at ${now()}`);
  });

  taskEvents.on(TASK_DELETED, ({ task, user }) => {
    const message = `Task "${task.title}" was deleted by ${user.email}`;
    addNotification(user.id, { type: TASK_DELETED, message, taskId: String(task._id) });
    console.log(`[Cleanup] ${message} at ${now()}`);
  });

  // Errors thrown inside any async listener arrive here (captureRejections).
  // Without this listener an emitted 'error' would crash the whole process.
  taskEvents.on('error', (err) => {
    console.error(`[Event Error] ${err.message} - caught by the 'error' listener at ${now()}; server keeps running`);
  });

  console.log(`Event listeners registered: ${taskEvents.eventNames().join(', ')}`);
};
