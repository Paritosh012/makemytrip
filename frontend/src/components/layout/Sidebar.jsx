import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useAuth } from '../../hooks/useAuth'
import { logoutUser } from '../../features/auth/authSlice'

const navConfig = {
  END_USER: [
    { to: '/home', label: '✦ Browse Packages' },
    { to: '/bookings', label: '⊞ My Bookings' },
    { to: '/apply-host', label: '⊕ Become a Host' },
  ],
  HOST: [
    { to: '/host/dashboard', label: '⊡ Dashboard' },
    { to: '/host/packages', label: '⊞ Packages' },
    { to: '/host/create-package', label: '⊕ New Package' },
    { to: '/host/subscription', label: '◈ Subscription' },
  ],
  SUPER_ADMIN: [
    { to: '/admin/dashboard', label: '⊡ Dashboard' },
    { to: '/admin/applications', label: '⊞ Applications' },
    { to: '/admin/tenants', label: '◈ Tenants' },
  ],
}

const Sidebar = () => {
  const { user } = useAuth()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const links = navConfig[user?.role] || []

  const handleLogout = async () => {
    await dispatch(logoutUser())
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-text">Travel<span>SaaS</span></div>
      </div>
      <div className="sidebar-role">{user?.role?.replace('_', ' ')}</div>
      <nav>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ marginTop: 'auto', padding: '24px 24px 0' }}>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>{user?.email}</div>
          <button className="btn btn-ghost" style={{ padding: '6px 0', fontSize: 13 }} onClick={handleLogout}>
            → Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
