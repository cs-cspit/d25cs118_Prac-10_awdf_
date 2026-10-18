import { useEffect, useState } from 'react'

// Suspense fallback shown while a lazy route chunk downloads.
// It stays invisible for the first `delay` ms so fast connections never see
// a loader flash on screen (minimum-delay fallback, avoids flicker).
function PageLoader({ label = 'Loading page…', delay = 300 }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  if (!visible) return <div className="page-loader-placeholder" aria-hidden="true" />

  return (
    <section className="section page-loader" role="status" aria-live="polite">
      <span className="spinner-ring" />
      <p>{label}</p>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line short" />
    </section>
  )
}

export default PageLoader
