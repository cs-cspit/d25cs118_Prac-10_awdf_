import express from 'express';
import Task from '../models/Task.js';
import protect from '../middleware/auth.js';
import cache, { allTasksKey, invalidateTasks, isCacheEnabled, taskKey } from '../config/cache.js';
import { validateTaskId, validateTaskBody } from '../middleware/validation.js';
import taskEvents, { TASK_CREATED, TASK_DELETED, TASK_UPDATED } from '../events/taskEvents.js';
import { sendCreatedNotification } from '../events/listeners.js';

const router = express.Router();

// NOTIFY_MODE=sync runs the notification inline (inside the route) instead of
// in the event listener - only to compare response times. Default: async.
const isSyncNotify = () => process.env.NOTIFY_MODE === 'sync';

// Every task route requires a valid JWT.
// Pipeline: protect (auth) -> validateTaskId / validateTaskBody -> controller
router.use(protect);

// Turns a Mongoose ValidationError into a 400 response with per-field messages
const sendMongooseValidation = (res, err) => {
  const errors = {};
  for (const field in err.errors) {
    errors[field] = err.errors[field].message;
  }
  return res.status(400).json({
    error: 'Validation failed',
    status: 400,
    details: errors
  });
};

// GET all tasks of the logged-in user
// Cache check -> HIT: return cached data | MISS: query MongoDB, store, return
router.get('/', async (req, res, next) => {
  try {
    const key = allTasksKey(req.user.id);

    if (isCacheEnabled()) {
      const cached = cache.get(key);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.status(200).json(cached);
      }
    }

    // lean() returns plain JS objects instead of full Mongoose documents:
    // faster to build, smaller in memory, and safe to keep in the cache.
    // The { user, createdAt } compound index on Task serves this query + sort.
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    console.log(`Cache MISS - fetched ${tasks.length} tasks from MongoDB for user ${req.user.id}`);

    if (isCacheEnabled()) cache.set(key, tasks);
    res.set('X-Cache', isCacheEnabled() ? 'MISS' : 'DISABLED');
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET a specific task by ID (only if it belongs to the user)
// Cached separately from the all-tasks list under its own key
router.get('/:id', validateTaskId, async (req, res, next) => {
  try {
    const key = taskKey(req.user.id, req.params.id);

    if (isCacheEnabled()) {
      const cached = cache.get(key);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.status(200).json(cached);
      }
    }

    const task = await Task.findOne({ _id: req.params.id, user: req.user.id }).lean();

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        status: 404
      });
    }

    console.log(`Cache MISS - fetched task ${req.params.id} from MongoDB`);

    if (isCacheEnabled()) cache.set(key, task);
    res.set('X-Cache', isCacheEnabled() ? 'MISS' : 'DISABLED');
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
});

// CREATE a new task owned by the logged-in user
router.post('/', validateTaskBody, async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;

    const newTask = await Task.create({
      title,
      description: description || '',
      completed: completed || false,
      priority: priority || 'medium',
      user: req.user.id
    });

    console.log(`Task created with ID: ${newTask._id}`);

    // Write succeeded -> the cached list is now stale
    invalidateTasks(req.user.id);

    const payload = { task: newTask.toObject(), user: req.user, emittedAt: null };

    if (isSyncNotify()) {
      // Anti-pattern for comparison: the client waits for the notification work
      try {
        await sendCreatedNotification({ ...payload, emittedAt: 'inline (sync mode)' });
      } catch (err) {
        console.error(`[Sync Notification Error] ${err.message}`);
      }
    }

    const respondedAt = new Date().toISOString();
    console.log(`[API] Response sent at          ${respondedAt}  (201 for "${newTask.title}")`);
    res.status(201).json({
      message: 'Task created successfully',
      task: newTask,
      respondedAt,
      notification: isSyncNotify() ? 'sent inline before responding (sync mode)' : 'queued - handled by the task-created listener'
    });

    // Emitted AFTER the response: emit() only schedules the listener's work,
    // the async listener continues on the event loop while the client already
    // has its 201.
    if (!isSyncNotify()) {
      taskEvents.emit(TASK_CREATED, { ...payload, emittedAt: new Date().toISOString() });
    }
  } catch (err) {
    if (err.name === 'ValidationError') return sendMongooseValidation(res, err);
    next(err);
  }
});

// UPDATE a task
router.put('/:id', validateTaskId, validateTaskBody, async (req, res, next) => {
  try {
    const { title, description, completed, priority } = req.body;

    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        status: 404
      });
    }

    // Update only provided fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (completed !== undefined) task.completed = completed;
    if (priority !== undefined) task.priority = priority;

    // save() triggers the pre-save hook (title trimming) and schema validation
    const updatedTask = await task.save();

    console.log(`Task updated with ID: ${req.params.id}`);
    invalidateTasks(req.user.id, req.params.id);
    res.status(200).json({
      message: 'Task updated successfully',
      task: updatedTask
    });
    taskEvents.emit(TASK_UPDATED, { task: updatedTask.toObject(), user: req.user });
  } catch (err) {
    if (err.name === 'ValidationError') return sendMongooseValidation(res, err);
    next(err);
  }
});

// DELETE a task
router.delete('/:id', validateTaskId, async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!task) {
      return res.status(404).json({
        error: 'Task not found',
        status: 404
      });
    }

    console.log(`Task deleted with ID: ${req.params.id}`);
    invalidateTasks(req.user.id, req.params.id);

    res.status(200).json({
      message: 'Task deleted successfully',
      task
    });
    taskEvents.emit(TASK_DELETED, { task: task.toObject(), user: req.user });
  } catch (err) {
    next(err);
  }
});

export default router;
