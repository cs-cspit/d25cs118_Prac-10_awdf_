import { useEffect, useState } from 'react'
import { getNotifications } from '../api'

const ICONS = {
  'task-created': '🔔',
  'task-updated': '✏️',
  'task-deleted': '🗑️',
}

// Polls GET /api/notifications. Entries appear here only when the
// background EventEmitter listeners finish - e.g. ~2 s after a task is created,
// although the create request itself returned immediately.
function NotificationPanel() {
  const [items, setItems] = useState([])

  useEffect(() => {
    let active = true
    const load = () => getNotifications().then((data) => active && setItems(data)).catch(() => {})
    load()
    const id = setInterval(load, 1500)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  return (
    <div className="notification-panel">
      <h3>Background Notifications</h3>
      <p className="notification-hint">Written by the task-created / task-updated / task-deleted event listeners after the API has already responded.</p>
      {items.length === 0 ? (
        <p className="notification-empty">No notifications yet — create, update or delete a task.</p>
      ) : (
        <ul className="notification-list">
          {items.map((n) => (
            <li key={`${n.at}-${n.taskId}-${n.type}`} className={`notification-item notification-${n.type}`}>
              <span className="notification-icon">{ICONS[n.type] || '•'}</span>
              <span className="notification-message">{n.message}</span>
              <time className="notification-time">{new Date(n.at).toLocaleTimeString()}</time>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default NotificationPanel
