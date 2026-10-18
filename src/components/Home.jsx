import { Link } from 'react-router-dom'
import { useAuth } from '../context/authContext'

function Home() {
  const { user } = useAuth()

  return (
    <section className="section section-hero">
      <div className="hero-copy">
        <p className="eyebrow">Welcome to Practical 10</p>
        <h1>
          Event-Driven <span className="gradient-text">Notifications</span>
        </h1>
        <p className="section-intro">
          Creating, updating or deleting a task now emits an event with Node&apos;s built-in
          EventEmitter. Listeners do the slow notification work in the background.
        </p>
        <p className="hero-note">
          <code>POST /api/tasks</code> saves the task, sends the <strong>201</strong> response and only
          then calls <code>emit(&apos;task-created&apos;)</code>. The listener needs about 2 seconds
          (simulated e-mail), but the client never waits for it. The console timestamps show the
          API response logged before the listener finishes.
        </p>
        <p className="hero-note">
          {user ? (
            <>Logged in as <strong>{user.name}</strong>. <Link to="/tasks">Go to your tasks →</Link></>
          ) : (
            <><Link to="/login">Log in</Link> or <Link to="/register">register</Link> to manage your tasks.</>
          )}
        </p>
        <div className="feature-list">
          <p>✨ Key Features:</p>
          <ul>
            <li>server/events/taskEvents.js — one shared EventEmitter instance</li>
            <li>task-created listener with a 2 s simulated delay (non-blocking)</li>
            <li>task-updated and task-deleted listeners with their own messages</li>
            <li>&apos;error&apos; listener catches errors thrown inside async listeners</li>
            <li>Timestamps logged at response time and at listener start / finish</li>
            <li>NOTIFY_MODE=sync for comparison: the response then waits ~2 s</li>
            <li>Still includes caching (P9), lazy loading (P8) and JWT auth (P7)</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

export default Home
