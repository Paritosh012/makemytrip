import { useEffect, useState } from "react";
import * as subscriptionService from "../../services/subscription.service";

const PLANS = [
  { id: "BASIC", label: "Basic", price: 999, agents: 5, bookings: 50 },
  { id: "PRO", label: "Pro", price: 2499, agents: 20, bookings: 200, featured: true },
  { id: "PREMIUM", label: "Premium", price: 5999, agents: 100, bookings: 1000 },
];

const Subscription = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [subscription, setSubscription] = useState(null);

  // 🔥 Fetch subscription properly
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await subscriptionService.getMySubscription();
        setSubscription(res.data || null);
      } catch {
        setSubscription(null);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const handlePurchase = async (plan) => {
    if (subscription?.status === "ACTIVE") {
      setMessage("You already have an active subscription");
      return;
    }

    setLoading(plan);
    setMessage("");
    setError("");

    try {
      // 🔥 Create order
      const { order } = await subscriptionService.createSubscriptionOrder(plan);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Travel SaaS",
        description: `${plan} Subscription`,
        order_id: order.id,

        handler: async function (response) {
          try {
            await subscriptionService.verifySubscriptionPayment({
              ...response,
              plan,
            });

            setMessage("Subscription activated successfully");

            // 🔥 refresh state instead of reload
            const res = await subscriptionService.getMySubscription();
            setSubscription(res.data || null);

          } catch {
            setError("Payment verification failed");
          }
        },

        modal: {
          ondismiss: () => {
            setMessage("Payment cancelled");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message || "Subscription failed");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div>Loading subscription...</div>;
  }

  const currentPlan = subscription?.plan;
  const isActive = subscription?.status === "ACTIVE";

  return (
    <div>
      <div className="page-header">
        <h1>Subscription Plans</h1>
        <p>Choose the right plan to grow your travel business</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {/* 🔥 Current plan info */}
      {subscription && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          Plan: <strong>{currentPlan}</strong> | Status:{" "}
          <strong>{subscription.status}</strong>
        </div>
      )}

      <div className="grid-3" style={{ maxWidth: 1000 }}>
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;

          return (
            <div
              key={plan.id}
              className="card"
              style={{
                padding: 20,
                border: isCurrent
                  ? "2px solid var(--accent2)"
                  : "1px solid var(--border)",
                position: "relative",
              }}
            >
              {plan.featured && !isCurrent && (
                <span className="badge badge-green">Popular</span>
              )}

              {isCurrent && (
                <span className="badge badge-blue">Active</span>
              )}

              <h2>{plan.label}</h2>

              <div style={{ fontSize: 28, fontWeight: 600 }}>
                ₹{plan.price.toLocaleString("en-IN")}
                <span style={{ fontSize: 14 }}> /month</span>
              </div>

              <ul style={{ marginTop: 15, marginBottom: 20 }}>
                <li>Agents: {plan.agents}</li>
                <li>Bookings/month: {plan.bookings}</li>
                <li>Package management</li>
                {plan.id !== "BASIC" && <li>Priority support</li>}
              </ul>

              <button
                className={`btn ${isCurrent ? "btn-secondary" : "btn-primary"}`}
                disabled={isCurrent || loading !== false || isActive}
                onClick={() => handlePurchase(plan.id)}
                style={{ width: "100%" }}
              >
                {isCurrent
                  ? "Active Plan"
                  : loading === plan.id
                  ? "Processing..."
                  : `Get ${plan.label}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Subscription;  