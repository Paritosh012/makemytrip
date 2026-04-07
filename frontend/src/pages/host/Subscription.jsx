import { useEffect, useState } from "react";
import * as subscriptionService from "../../services/subscription.service";

const PLANS = [
  { id: "BASIC", label: "Basic", price: "₹999", agents: 5, bookings: 50 },
  {
    id: "PRO",
    label: "Pro",
    price: "₹2,499",
    agents: 20,
    bookings: 200,
    featured: true,
  },
  {
    id: "PREMIUM",
    label: "Premium",
    price: "₹5,999",
    agents: 100,
    bookings: 1000,
  },
];

const Subscription = () => {
  const [loading, setLoading] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [currentPlan, setCurrentPlan] = useState(null);

  // 🔥 fetch current subscription
  useEffect(() => {
    subscriptionService
      .getMySubscription()
      .then((res) => {
        setCurrentPlan(res.data?.plan || null);
      })
      .catch(() => {
        setCurrentPlan(null);
      });
  }, []);

  const handlePurchase = async (plan) => {
    if (currentPlan) {
      setMessage("You already have an active subscription");
      return;
    }

    setLoading(plan);
    setMessage("");

    try {
      await subscriptionService.purchaseSubscription(plan);
      setMessage("Subscription activated");

      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      console.log("FULL ERROR:", err);

      const msg =
        err.response?.data?.message || err.message || "Subscription failed";

      setMessage(msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Subscription Plans</h1>
        <p>Choose the right plan to grow your travel business</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && (
        <div
          className={
            message.toLowerCase().includes("fail") ||
            message.toLowerCase().includes("exists")
              ? "alert alert-error"
              : "alert alert-success"
          }
        >
          {message}
        </div>
      )}

      {currentPlan && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          Current Plan: <strong>{currentPlan}</strong>
        </div>
      )}

      <div className="grid-3" style={{ maxWidth: 1000 }}>
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.id;

          return (
            <div
              key={plan.id}
              className="card"
              style={{
                padding: 20,
                border: isActive
                  ? "2px solid var(--accent2)"
                  : "1px solid var(--border)",
                position: "relative",
              }}
            >
              {plan.featured && !isActive && (
                <span
                  className="badge badge-green"
                  style={{ position: "absolute", top: 10, right: 10 }}
                >
                  Popular
                </span>
              )}

              {isActive && (
                <span
                  className="badge badge-blue"
                  style={{ position: "absolute", top: 10, right: 10 }}
                >
                  Active
                </span>
              )}

              <h2>{plan.label}</h2>

              <div style={{ fontSize: 28, fontWeight: 600 }}>
                {plan.price}
                <span style={{ fontSize: 14, color: "var(--muted)" }}>
                  {" "}
                  /month
                </span>
              </div>

              <ul style={{ marginTop: 15, marginBottom: 20 }}>
                <li>Agents: {plan.agents}</li>
                <li>Bookings/month: {plan.bookings}</li>
                <li>Package management</li>
                {plan.id !== "BASIC" && <li>Priority support</li>}
              </ul>

              <button
                className={`btn ${isActive ? "btn-secondary" : "btn-primary"}`}
                disabled={isActive || loading !== null}
                onClick={() => handlePurchase(plan.id)}
                style={{ width: "100%" }}
              >
                {isActive
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
