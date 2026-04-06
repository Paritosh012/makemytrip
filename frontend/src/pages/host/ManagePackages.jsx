import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as packageService from '../../services/package.service'

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const statusBadge = (status) => {
  const map = { ACTIVE: 'badge-green', DRAFT: 'badge-yellow', ARCHIVED: 'badge-gray' }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>
}

const ManagePackages = () => {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editPkg, setEditPkg] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  const fetchPackages = () => {
    setLoading(true)
    packageService.getPackages()
      .then((data) => setPackages(data.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPackages() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Archive this package?')) return
    try {
      await packageService.deletePackage(id)
      fetchPackages()
    } catch (err) {
      setError(err.message)
    }
  }

  const openEdit = (pkg) => {
    setEditPkg(pkg)
    setEditForm({
      title: pkg.title,
      destination: pkg.destination,
      description: pkg.description,
      price: pkg.price,
      status: pkg.status,
      startDate: pkg.startDate?.split('T')[0],
      endDate: pkg.endDate?.split('T')[0],
    })
  }

  const handleEditSave = async () => {
    setSaving(true)
    try {
      await packageService.updatePackage(editPkg._id, {
        ...editForm,
        price: Number(editForm.price),
      })
      setEditPkg(null)
      fetchPackages()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex-between page-header">
        <div>
          <h1>My Packages</h1>
          <p>Manage your listed travel packages</p>
        </div>
        <Link to="/host/create-package" className="btn btn-primary" style={{ width: 'auto', textDecoration: 'none' }}>
          + New Package
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loader-wrap"><div className="spinner" /></div>
      ) : packages.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📦</div>
          <p>No packages yet. Create your first one!</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Destination</th>
                  <th>Price</th>
                  <th>Seats</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg._id}>
                    <td style={{ fontWeight: 500 }}>{pkg.title}</td>
                    <td className="text-muted">{pkg.destination}</td>
                    <td>₹{pkg.price?.toLocaleString('en-IN')}</td>
                    <td>{pkg.seatsAvailable}/{pkg.seatsTotal}</td>
                    <td className="text-muted">
                      {formatDate(pkg.startDate)} → {formatDate(pkg.endDate)}
                    </td>
                    <td>{statusBadge(pkg.status)}</td>
                    <td>
                      <div className="actions-row">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(pkg)}>Edit</button>
                        {pkg.status !== 'ARCHIVED' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(pkg._id)}>Archive</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editPkg && (
        <div className="modal-overlay" onClick={() => setEditPkg(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Package</h2>
            {[
              ['Title', 'title', 'text'],
              ['Destination', 'destination', 'text'],
              ['Price (INR)', 'price', 'number'],
            ].map(([label, name, type]) => (
              <div className="form-group" key={name}>
                <label>{label}</label>
                <input
                  type={type}
                  value={editForm[name] || ''}
                  onChange={(e) => setEditForm({ ...editForm, [name]: e.target.value })}
                />
              </div>
            ))}
            <div className="form-group">
              <label>Description</label>
              <textarea value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={editForm.status || ''} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div className="actions-row">
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleEditSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="btn btn-secondary" onClick={() => setEditPkg(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagePackages
