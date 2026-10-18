import { useState } from 'react'

function Contact() {
  const [isVisible, setIsVisible] = useState(true)
  const [message, setMessage] = useState('')

  return (
    <section className="section section-contact">
      <h2>Contact &amp; Learn More</h2>
      <p className="section-intro">Full-stack architecture breakdown and interactive contact form.</p>
      
      <div style={{ marginBottom: '2rem' }}>
        <button type="button" className="btn-edit" onClick={() => setIsVisible((value) => !value)}>
          {isVisible ? 'Hide contact details' : 'Show contact details'}
        </button>

        {isVisible && (
          <div className="contact-card" style={{ marginTop: '1rem' }}>
            <p className="contact-email" style={{ fontWeight: 'bold', color: 'var(--primary-light)', marginBottom: '1rem' }}>
              hello@example.com
            </p>
            <div className="form-group" style={{ maxWidth: '400px' }}>
              <label htmlFor="message">Your message</label>
              <input
                id="message"
                className="form-input"
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Type your message here"
              />
            </div>
            <p style={{ marginTop: '1rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
              Preview: {message || 'Start typing...'}
            </p>
          </div>
        )}
      </div>

      <div className="contact-card">
        <h3>About This Project</h3>
        <p><strong>Course:</strong> Advanced Web Development Fundamentals (AWDF)</p>
        <p><strong>Practical:</strong> 9 — In-Memory Caching and Query Optimization</p>
        <p><strong>Tech Stack:</strong> React 19, React Router 7, Vite 8, Node.js, Express 5, MongoDB, Mongoose 8, bcryptjs, jsonwebtoken, recharts (lazy), node-cache</p>

        <h3 style={{ marginTop: '30px' }}>Key Learning Outcomes</h3>
        <ul>
          <li>Cache API responses in memory with node-cache and a TTL</li>
          <li>Design stable cache keys and invalidate them on every write</li>
          <li>Measure response times empirically (cached vs uncached)</li>
          <li>Optimize MongoDB reads with a compound index and lean()</li>
          <li>Explain why process-local caches break with multiple server instances</li>
        </ul>

        <h3 style={{ marginTop: '30px' }}>Architecture</h3>
        <div className="arch-flow">
          <span className="arch-badge">React (Vite :5173)</span>
          <span className="arch-arrow">→</span>
          <span className="arch-badge">Vite Proxy /api/*</span>
          <span className="arch-arrow">→</span>
          <span className="arch-badge">Express (:5000)</span>
          <span className="arch-arrow">→</span>
          <span className="arch-badge">Auth middleware (JWT)</span>
          <span className="arch-arrow">→</span>
          <span className="arch-badge">Validation middleware</span>
          <span className="arch-arrow">→</span>
          <span className="arch-badge">node-cache (HIT / MISS)</span>
          <span className="arch-arrow">→</span>
          <span className="arch-badge">Mongoose ODM</span>
          <span className="arch-arrow">→</span>
          <span className="arch-badge">MongoDB</span>
        </div>

        <h3 style={{ marginTop: '30px' }}>Get Started</h3>
        <p>1. Start MongoDB locally</p>
        <p>2. Copy <code>.env.example</code> to <code>.env</code> and set JWT_SECRET, then run <code>npm run server</code> (Express on port 5000)</p>
        <p>3. Run <code>npm run dev</code> (Vite on port 5173)</p>
        <p>4. Register, log in, then visit the <strong>Tasks</strong> page!</p>
      </div>
    </section>
  )
}

export default Contact
