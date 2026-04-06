import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import * as packageService from '../../services/package.service'
import * as bookingService from '../../services/booking.service'
import { setPendingBooking } from '../../features/booking/bookingSlice'
import { useNavigate } from 'react-router-dom'

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const Home = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookingPkg, setBookingPkg] = useState(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState('')

  useEffect(() => {
    packageService.getPackages()
      .then((data) => setPackages(data.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleBook = async (pkg) => {
    setBookingPkg(pkg)
    setBookingError('')
  }

  const confirmBook = async () => {
    setBookingLoading(true)
    setBookingError('')
    try {
      const result = await bookingService.createBooking({ packageId: bookingPkg._id })
      dispatch(setPendingBooking({ bookingId: result.data._id, pkg: bookingPkg }))
      setBookingPkg(null)
      navigate('/bookings')
    } catch (err) {
      setBookingError(err.message)
    } finally {
      setBookingLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Explore Packages</h1>
        <p>Discover handpicked travel experiences</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loader-wrap"><div className="spinner" /></div>
      ) : packages.length === 0 ? (
        <div className="empty-state">
          <div className="icon">✈</div>
          <p>No packages available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="grid-3">
          {packages.map((pkg) => (
            <div key={pkg._id} className="pkg-card">
              <div
                style={{
                  height: 140,
                  background: `linear-gradient(135deg, #1a1a40 0%, #0f1a2e 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 40,
                }}
              >
                ✈
              </div>
              <div className="pkg-card-body">
                <h3>{pkg.title}</h3>
                <div className="text-muted" style={{ fontSize: 13, marginBottom: 8 }}>
                  📍 {pkg.destination}
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
                  {pkg.description?.slice(0, 80)}...
                </p>
                <div className="pkg-meta">
                  <span className="pkg-meta-item">🗓 {formatDate(pkg.startDate)}</span>
                  <span className="pkg-meta-item">→ {formatDate(pkg.endDate)}</span>
                  <span className="pkg-meta-item">💺 {pkg.seatsAvailable} seats</span>
                </div>
                <div className="flex-between" style={{ marginTop: 16 }}>
                  <div className="pkg-price">₹{pkg.price?.toLocaleString('en-IN')}<span>/person</span></div>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: 'auto' }}
                    disabled={pkg.seatsAvailable === 0}
                    onClick={() => handleBook(pkg)}
                  >
                    {pkg.seatsAvailable === 0 ? 'Full' : 'Book Now'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking confirmation modal */}
      {bookingPkg && (
        <div className="modal-overlay" onClick={() => setBookingPkg(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Booking</h2>
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{bookingPkg.title}</div>
              <div className="text-muted">📍 {bookingPkg.destination}</div>
              <div style={{ marginTop: 12 }}>
                <span className="pkg-price">₹{bookingPkg.price?.toLocaleString('en-IN')}</span>
              </div>
            </div>
            {bookingError && <div className="alert alert-error">{bookingError}</div>}
            <div className="actions-row">
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={confirmBook} disabled={bookingLoading}>
                {bookingLoading ? 'Booking...' : 'Confirm & Proceed to Payment'}
              </button>
              <button className="btn btn-secondary" onClick={() => setBookingPkg(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
