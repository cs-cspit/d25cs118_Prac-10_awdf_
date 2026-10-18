// Last few notifications per user, kept in memory so the React UI can show
// what the background listeners did. Lost on restart - fine for a demo.
const MAX_PER_USER = 20;
const store = new Map();

export const addNotification = (userId, { type, message, taskId }) => {
  const list = store.get(userId) || [];
  list.unshift({ type, message, taskId, at: new Date().toISOString() });
  store.set(userId, list.slice(0, MAX_PER_USER));
};

export const getNotifications = (userId) => store.get(userId) || [];

export const clearNotifications = (userId) => store.delete(userId);
