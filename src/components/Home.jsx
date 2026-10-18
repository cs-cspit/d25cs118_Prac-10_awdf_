import { Link } from 'react-router-dom'
import { useAuth } from '../context/authContext'

function Home() {
  const { user } = useAuth()

  return (
    <section className="section section-hero">
      <div className="hero-copy">
        <p className="eyebrow">Welcome to Practical 9</p>
        <h1>
          In-Memory <span className="gradient-text">Caching</span>
        </h1>
        <p className="section-intro">
          The Task Manager API now answers repeated reads from memory using
          node-cache, and invalidates the cache on every write.
        </p>
        <p className="hero-note">
          <code>GET /api/tasks</code> checks the cache first. On a <strong>HIT</strong> the
          stored list is returned immediately; on a <strong>MISS</strong> MongoDB is queried
          and the result is cached for 60 seconds. Any POST, PUT or DELETE deletes the
          affected keys so stale data is never served. Every response carries
          <code> X-Cache</code> and <code>X-Response-Time</code> headers.
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
            <li>node-cache with a 60s TTL on GET /api/tasks (per-user key)</li>
            <li>GET /api/tasks/:id cached separately under its own key</li>
            <li>Cache invalidated on every POST / PUT / DELETE</li>
            <li>GET /api/cache/stats — hit / miss counters debug endpoint</li>
            <li>Compound index {'{ user: 1, createdAt: -1 }'} + lean() queries</li>
            <li>Measured with 2000 tasks: ~11 ms cached vs ~35 ms uncached (server time)</li>
            <li>Still includes lazy loading (P8) and JWT auth (P7)</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

export default Home
