// Central API module - one base URL and one place that attaches the JWT.
// Relative /api path: the Vite proxy forwards it to Express on port 5000.
const BASE_URL = '/api'
const TOKEN_KEY = 'token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

// Fired when a protected request returns 401 (expired / invalid token).
// AuthProvider listens for it, clears the user and the app redirects to /login.
export const UNAUTHORIZED_EVENT = 'auth:unauthorized'

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearToken()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }

    const message = data.details
      ? Object.values(data.details).join('; ')
      : data.error || `Request failed (${response.status})`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return data
}

// ---------- Auth ----------
export const registerUser = (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false })
export const loginUser = (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false })
export const getMe = () => request('/auth/me')

// ---------- Tasks ----------
export const getTasks = () => request('/tasks')
export const createTask = (task) => request('/tasks', { method: 'POST', body: task })
export const updateTask = (id, task) => request(`/tasks/${id}`, { method: 'PUT', body: task })
export const deleteTask = (id) => request(`/tasks/${id}`, { method: 'DELETE' })
