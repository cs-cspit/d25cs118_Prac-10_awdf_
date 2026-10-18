import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import Spinner from './Spinner'

// Renders children only for a logged-in user; otherwise redirects to /login
// and remembers where the user was going so login can send them back.
function ProtectedRoute({ children }) {
  const { user, checking } = useAuth()
  const location = useLocation()

  if (checking) return <Spinner label="Checking session…" />

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

export default ProtectedRoute
