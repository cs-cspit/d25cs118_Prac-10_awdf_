import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'

const links = [
  { to: '/', label: 'Home' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/contact', label: 'Contact' },
]

const navClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="brand">AWDF P-9</div>
      <nav aria-label="Main navigation">
        <ul className="nav-list">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} end={link.to === '/'} className={navClass}>
                {link.label}
              </NavLink>
            </li>
          ))}
          {user ? (
            <>
              <li className="nav-user" title={user.email}>👤 {user.name}</li>
              <li>
                <button type="button" className="nav-link nav-logout" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li><NavLink to="/login" className={navClass}>Login</NavLink></li>
              <li><NavLink to="/register" className={navClass}>Register</NavLink></li>
            </>
          )}
        </ul>
      </nav>
    </header>
  )
}

export default Navbar
