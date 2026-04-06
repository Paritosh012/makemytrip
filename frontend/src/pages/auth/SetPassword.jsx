import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import * as authService from '../../services/auth.service'

const SetPassword = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    if (form.password !== form.confirm) return setError('Passwords do not match')
    setError('')
    setLoading(true)
    try {
      await authService.setPassword({ email, password: form.password })
      navigate('/login', { state: { message: 'Account created! Please sign in.' } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Set password<span style={{ color: 'var(--accent)' }}>.</span></h1>
        <p className="subtitle">Choose a secure password for your account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
              placeholder="Repeat your password"
              required
            />
          </div>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Setting password...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SetPassword
