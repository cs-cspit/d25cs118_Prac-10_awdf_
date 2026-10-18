import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext'
import {
  clearToken,
  getMe,
  getToken,
  loginUser,
  registerUser,
  setToken,
  UNAUTHORIZED_EVENT,
} from '../api'

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // If a token is stored we must ask /me who it belongs to before rendering protected pages
  const [checking, setChecking] = useState(() => Boolean(getToken()))

  // Restore session on page load using GET /api/auth/me
  useEffect(() => {
    if (!getToken()) return

    let isMounted = true
    getMe()
      .then((data) => { if (isMounted) setUser(data.user) })
      .catch(() => { if (isMounted) setUser(null) })
      .finally(() => { if (isMounted) setChecking(false) })

    return () => { isMounted = false }
  }, [])

  // Any protected request that returns 401 logs the user out
  useEffect(() => {
    const handleUnauthorized = () => setUser(null)
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await loginUser({ email, password })
    setToken(data.token)
    setUser(data.user)
    return data
  }, [])

  const register = useCallback((name, email, password) => registerUser({ name, email, password }), [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, checking, login, register, logout }),
    [user, checking, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
