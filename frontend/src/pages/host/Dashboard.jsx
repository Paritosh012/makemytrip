import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import * as packageService from '../../services/package.service'

const HostDashboard = () => {
  const { user } = useAuth()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    packageService.getPackages()
      .then((data) => setPackages(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const active = packages.filter((p) => p.status === 'ACTIVE').length
  const draft = packages.filter((p) => p.status === 'DRAFT').length
  const archived = packages.filter((p) => p.status === 'ARCHIVED').length

  return (
    <div>
      <div className="page-header">
        <h1>Host Dashboard</h1>
        <p>Welcome back, {user?.name}</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-label">Total Packages</div>
          <div className="stat-value">{loading ? '—' : packages.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value" style={{ color: 'var(--accent2)' }}>{loading ? '—' : active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Drafts</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{loading ? '—' : draft}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Archived</div>
          <div className="stat-value" style={{ color: 'var(--muted)' }}>{loading ? '—' : archived}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2>Quick Actions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/host/create-package" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              + Create New Package
            </Link>
            <Link to="/host/packages" className="btn btn-secondary" style={{ textDecoration: 'none', justifyContent: 'center', display: 'flex' }}>
              View All Packages
            </Link>
            <Link to="/host/subscription" className="btn btn-secondary" style={{ textDecoration: 'none', justifyContent: 'center', display: 'flex' }}>
              Manage Subscription
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Account Info</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Name', user?.name],
              ['Email', user?.email],
              ['Role', user?.role],
              ['Tenant ID', user?.tenantId ? user.tenantId.slice(-8) + '...' : 'Not assigned'],
            ].map(([label, val]) => (
              <div key={label} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="text-muted">{label}</span>
                <span style={{ fontSize: 14 }}>{val || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HostDashboard
