import { Component } from 'react'

// If a lazy chunk fails to download (offline, server restarted after a new
// build, etc.) React throws during render. This boundary catches it and shows
// a retry button instead of a blank white screen.
class ChunkErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Failed to load page chunk:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="section">
          <div className="error-card" role="alert">
            <h3>Could not load this page</h3>
            <p>The page's code failed to download. Check your connection and try again.</p>
            <button type="button" className="btn-submit" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </section>
      )
    }

    return this.props.children
  }
}

export default ChunkErrorBoundary
