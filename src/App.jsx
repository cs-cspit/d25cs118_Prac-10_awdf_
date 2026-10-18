import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import './App.css'
import AuthProvider from './context/AuthProvider'
import Navbar from './components/Navbar'
import Home from './components/Home'
import ProtectedRoute from './components/ProtectedRoute'
import PageLoader from './components/PageLoader'
import ChunkErrorBoundary from './components/ChunkErrorBoundary'

// Home is the landing page, so it stays in the main bundle (static import).
// Every other route is code-split: its chunk downloads only when visited.
// React.lazy() requires each of these files to use `export default`.
const Tasks = lazy(() => import('./components/Tasks'))
const Contact = lazy(() => import('./components/Contact'))
const Login = lazy(() => import('./components/Login'))
const Register = lazy(() => import('./components/Register'))

function AppRoutes() {
  const location = useLocation()

  return (
    // key resets the boundary when the user navigates away from a failed page
    <ChunkErrorBoundary key={location.pathname}>
      {/* Suspense wraps only the Routes block - Navbar and footer stay visible */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Suspense>
    </ChunkErrorBoundary>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <Navbar />
          <AppRoutes />
          <footer className="app-footer">
            <p>Practical 9 — In-Memory Caching &amp; Query Optimization &bull; AWDF &bull; D25CS118</p>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
