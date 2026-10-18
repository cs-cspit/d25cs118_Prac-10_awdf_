import { lazy, memo, Suspense, useCallback, useEffect, useState } from 'react'
import Spinner from './Spinner'
import ErrorMessage from './ErrorMessage'
import { createTask, deleteTask, getTasks, updateTask } from '../api'
import { useAuth } from '../context/authContext'

// Heavy third-party chart (recharts) - its chunk downloads only when the user
// clicks "Show statistics", not when the Tasks page first opens.
const TaskStats = lazy(() => import('./TaskStats'))

const PRIORITY_LABELS = {
  low: '🟢 Low',
  medium: '🟡 Medium',
  high: '🔴 High'
}

// memo: found with the React DevTools Profiler - typing in the form re-rendered
// every task card on each keystroke even though the list had not changed.
// With memo + stable (useCallback) handlers, TaskList now skips those renders.
const TaskList = memo(function TaskList({ tasks, onEdit, onDelete, onToggle }) {
  return (
    <div className="card-grid">
      {tasks.length === 0 ? (
        <p className="empty-state">No tasks yet. Create one to get started!</p>
      ) : (
        tasks.map((task) => (
          <article key={task._id} className={`task-card ${task.completed ? 'task-completed' : ''}`}>
            <div className="task-header">
              <h3 className={task.completed ? 'title-done' : ''}>{task.title}</h3>
              <span className={`priority-badge priority-${task.priority || 'medium'}`}>
                {PRIORITY_LABELS[task.priority || 'medium']}
              </span>
            </div>
            <p className="task-description">{task.description || 'No description provided.'}</p>
            <div className="task-meta">
              <label className="completed-toggle">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onToggle(task)}
                />
                <span>{task.completed ? 'Completed' : 'Pending'}</span>
              </label>
              <span className="task-date">
                {task.createdAt && !isNaN(new Date(task.createdAt).getTime())
                  ? new Date(task.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  : '—'}
              </span>
            </div>
            <div className="task-actions">
              <button className="btn-edit" onClick={() => onEdit(task)}>
                Edit
              </button>
              <button className="btn-delete" onClick={() => onDelete(task._id)}>
                Delete
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  )
})

function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium' })
  const [editingId, setEditingId] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showStats, setShowStats] = useState(false)
  const { user } = useAuth()

  // Refresh the task list (used after create / update / delete).
  // The JWT is attached by api.js; a 401 logs the user out automatically.
  const fetchTasks = useCallback(async () => {
    try {
      const data = await getTasks()
      setTasks(data)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load - GET /api/tasks
  useEffect(() => {
    let isMounted = true

    getTasks()
      .then((result) => {
        if (isMounted) {
          setTasks(result)
          setError('')
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to fetch tasks')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setSubmitError('')
  }

  const showSuccess = useCallback((message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setSubmitError('Title is required')
      return
    }

    try {
      const result = editingId
        ? await updateTask(editingId, formData)
        : await createTask(formData)

      showSuccess(result.message ? `✓ ${result.message}` : '✓ Task saved successfully!')
      await fetchTasks()

      setFormData({ title: '', description: '', priority: 'medium' })
      setEditingId(null)
    } catch (err) {
      setSubmitError(err.message || 'Failed to save task')
    }
  }

  const handleEdit = useCallback((task) => {
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority || 'medium'
    })
    setEditingId(task._id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      await deleteTask(id)
      showSuccess('✓ Task deleted successfully!')
      await fetchTasks()
    } catch (err) {
      setError(err.message || 'Failed to delete task')
    }
  }, [fetchTasks, showSuccess])

  const handleToggleCompleted = useCallback(async (task) => {
    try {
      await updateTask(task._id, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        completed: !task.completed
      })
      await fetchTasks()
    } catch (err) {
      setError(err.message || 'Failed to toggle task')
    }
  }, [fetchTasks])

  const handleCancel = () => {
    setFormData({ title: '', description: '', priority: 'medium' })
    setEditingId(null)
    setSubmitError('')
  }

  return (
    <section className="section section-tasks">
      <h2>Task Manager</h2>
      <p className="section-intro">
        Logged in as <strong>{user?.name}</strong> — every request below carries your JWT in the Authorization header.
      </p>

      {/* Form Section */}
      <div className="form-container">
        <h3>{editingId ? 'Edit Task' : 'Create New Task'}</h3>
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="title">Task Title *</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter task title"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter task description (optional)"
              className="form-textarea"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>
          </div>

          {submitError && <div className="form-error">{submitError}</div>}
          {successMessage && <div className="form-success">{successMessage}</div>}

          <div className="form-actions">
            <button type="submit" className="btn-submit">
              {editingId ? 'Update Task' : 'Create Task'}
            </button>
            {editingId && (
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Statistics - lazy-loaded heavy component */}
      <div className="tasks-section">
        <button type="button" className="btn-edit" onClick={() => setShowStats((v) => !v)}>
          {showStats ? 'Hide statistics' : '📊 Show statistics'}
        </button>
        {showStats && (
          <Suspense fallback={<Spinner label="Loading chart library…" />}>
            <TaskStats tasks={tasks} />
          </Suspense>
        )}
      </div>

      {/* Tasks Display Section */}
      <div className="tasks-section">
        <h3>Your Tasks</h3>

        {error && <ErrorMessage message={error} />}
        {loading && <Spinner />}
        {!loading && !error && (
          <TaskList
            tasks={tasks}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggle={handleToggleCompleted}
          />
        )}
      </div>
    </section>
  )
}

export default Tasks
