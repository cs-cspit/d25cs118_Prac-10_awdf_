import express from 'express';
import protect from '../middleware/auth.js';
import { clearNotifications, getNotifications } from '../events/notificationStore.js';

const router = express.Router();

router.use(protect);

// GET /api/notifications - notifications produced by the background listeners
router.get('/', (req, res) => {
  res.status(200).json(getNotifications(req.user.id));
});

// DELETE /api/notifications - clear the list
router.delete('/', (req, res) => {
  clearNotifications(req.user.id);
  res.status(200).json({ message: 'Notifications cleared' });
});

export default router;
