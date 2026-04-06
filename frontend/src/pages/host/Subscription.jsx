import { useState } from 'react'
import * as subscriptionService from '../../services/subscription.service'

const PLANS = [
  {
    id: 'BASIC',
    label: 'Basic',
    price: '₹999',
    agents: 5,
    bookings: 50,
  },
  {
    id: 'PRO',
    label: 'Pro',
    price: '₹2,499',
    agents: 20,
    bookings: 200,
    featured: true,
  },
  {
    id: 'PREMIUM',
    label: 'Premium',
    price: '₹5,999',
    agents: 100,
    bookings: 1000,
  },
]

const Subscription = () => {
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handlePurchase = async (planId) => {
    if (!window.confirm(`Subscribe to the ${planId} plan?`)) return
    setLoading(planId)
    setError('')
    try {
      await subscriptionService.purchaseSubscription(planId)
      setSuccess(`${planId} plan activated successfully! Refresh to see updates.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Subscription Plans</h1>
        <p>Choose the right plan to grow your travel business</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="grid-3" style={{ maxWidth: 900 }}>
        {PLANS.map((plan) => (
          <div key={plan.id} className={`plan-card${plan.featured ? ' featured' : ''}`}>
            {plan.featured && (
              <div style={{ marginBottom: 8 }}>
                <span className="badge badge-green">Most Popular</span>
              </div>
            )}
            <h3>{plan.label}</h3>
            <div className="plan-price">{plan.price}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 400 }}>/mo</span></div>
            <ul className="plan-features">
              <li>Up to {plan.agents} agents</li>
              <li>{plan.bookings} bookings/month</li>
              <li>Package management</li>
              <li>Booking analytics</li>
              {plan.id !== 'BASIC' && <li>Priority support</li>}
              {plan.id === 'PREMIUM' && <li>Custom integrations</li>}
            </ul>
            <button
              className="btn btn-primary"
              onClick={() => handlePurchase(plan.id)}
              disabled={!!loading}
            >
              {loading === plan.id ? 'Processing...' : `Get ${plan.label}`}
            </button>
          </div>
        ))}
      </div>

      <div className="alert alert-info" style={{ maxWidth: 500, marginTop: 24 }}>
        Note: Purchasing a plan will activate your tenant account and allow you to start creating packages.
      </div>
    </div>
  )
}

export default Subscription
