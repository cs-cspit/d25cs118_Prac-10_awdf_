import { EventEmitter } from 'node:events';

// One shared emitter for task side effects (Node's built-in EventEmitter,
// no message queue or extra dependency).
//
// captureRejections: true - if an async listener throws (its promise rejects),
// Node forwards that error to this emitter's 'error' event instead of leaving
// an unhandled rejection. listeners.js registers the 'error' listener.
class TaskEvents extends EventEmitter {}

const taskEvents = new TaskEvents({ captureRejections: true });

// Event names in one place so routes and listeners can't drift apart
export const TASK_CREATED = 'task-created';
export const TASK_UPDATED = 'task-updated';
export const TASK_DELETED = 'task-deleted';

export default taskEvents;
