import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as packageService from '../../services/package.service'

const CreatePackage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', destination: '', description: '',
    price: '', seatsTotal: '', startDate: '', endDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await packageService.createPackage({
        ...form,
        price: Number(form.price),
        seatsTotal: Number(form.seatsTotal),
      })
      navigate('/host/packages')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // min date = tomorrow
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  return (
    <div>
      <div className="page-header">
        <h1>Create Package</h1>
        <p>List a new travel experience for your customers</p>
      </div>

      <div style={{ maxWidth: 640 }}>
        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Package Title</label>
              <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Goa Beach Retreat" required />
            </div>
            <div className="form-group">
              <label>Destination</label>
              <input name="destination" value={form.destination} onChange={handleChange} placeholder="e.g. Goa, India" required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe what's included, highlights, itinerary..." required style={{ minHeight: 100 }} />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Price (INR)</label>
                <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="e.g. 12000" min="1" required />
              </div>
              <div className="form-group">
                <label>Total Seats</label>
                <input type="number" name="seatsTotal" value={form.seatsTotal} onChange={handleChange} placeholder="e.g. 20" min="1" required />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" name="startDate" value={form.startDate} onChange={handleChange} min={tomorrow} required />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" name="endDate" value={form.endDate} onChange={handleChange} min={form.startDate || tomorrow} required />
              </div>
            </div>

            <div className="actions-row">
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Creating...' : 'Create Package'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/host/packages')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreatePackage
