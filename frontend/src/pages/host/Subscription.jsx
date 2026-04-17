import { useEffect, useState } from "react";
import * as subscriptionService from "../../services/subscription.service";

const PLANS = [
  { id: "BASIC",   label: "Basic",   price: 999,  agents: 5,   bookings: 50   },
  { id: "PRO",     label: "Pro",     price: 2499, agents: 20,  bookings: 200, featured: true },
  { id: "PREMIUM", label: "Premium", price: 5999, agents: 100, bookings: 1000 },
];

const Subscription = () => {
  const [loading, setLoading]               = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage]               = useState("");
  const [error, setError]                   = useState("");
  const [subscription, setSubscription]     = useState(null);

  useEffect(() => { fetchSubscription(); }, []);

  const fetchSubscription = async () => {
    try {
      const res = await subscriptionService.getMySubscription();
      setSubscription(res.data || null);
    } catch (err) {
      console.error(err);
      setSubscription(null);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload  = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const openRazorpay = async (subscriptionId, plan) => {
    const loaded = await loadRazorpay();
    if (!loaded) { setError("Payment gateway failed to load"); return; }

    const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!key) { setError("Razorpay key missing"); return; }

    const options = {
      key,
      subscription_id: subscriptionId,
      name: "Your Tech Buddy",
      description: `${plan} Plan Subscription`,

      handler: async (response) => {
        try {
          // ✅ Correct function name
          await subscriptionService.verifySubscriptionPayment({
            razorpay_payment_id:       response.razorpay_payment_id,
            razorpay_subscription_id:  response.razorpay_subscription_id,
            razorpay_signature:        response.razorpay_signature,
            plan,
          });
          setMessage("Subscription activated successfully!");
          setError("");
          await fetchSubscription();
        } catch (err) {
          setError(err.response?.data?.message || "Payment verification failed");
        } finally {
          setLoading(null);
        }
      },

      modal: {
        ondismiss: () => {
          setError("Payment cancelled");
          setLoading(null);
        },
      },

      theme: { color: "#6366f1" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleSubscribe = async (planId) => {
    if (loading) return;
    setLoading(planId);
    setError("");
    setMessage("");

    try {
      // 🔥 Resume PENDING payment — backend will reuse existing rzp sub
      if (subscription?.status === "PENDING" && subscription?.razorpaySubscriptionId) {
        await openRazorpay(subscription.razorpaySubscriptionId, subscription.plan);
        return;
      }

      // 🔥 Create new subscription
      const res = await subscriptionService.createSubscription(planId);

      if (!res?.data?.subscriptionId) {
        throw new Error("Invalid subscription response");
      }

      await openRazorpay(res.data.subscriptionId, planId);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(null);
    }
  };

  if (initialLoading) return <div className="page-loading">Loading subscription...</div>;

  const currentPlan = subscription?.plan;
  const status      = subscription?.status;

  return (
    <div>
      <div className="page-header">
        <h1>Subscription Plans</h1>
        <p>Choose the right plan to grow your business</p>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {subscription && (
        <div className="alert alert-info">
          Plan: <strong>{currentPlan}</strong> | Status: <strong>{status}</strong>
        </div>
      )}

      {status === "PENDING" && (
        <div className="alert alert-warning">
          ⚠ Payment incomplete. Click your plan below to retry.
        </div>
      )}

      <div className="grid-3" style={{ maxWidth: 1000 }}>
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isActive  = isCurrent && status === "ACTIVE";
          const isPending = isCurrent && status === "PENDING";

          return (
            <div
              key={plan.id}
              className="card"
              style={{
                padding: 20,
                border: isCurrent
                  ? "2px solid var(--accent2)"
                  : "1px solid var(--border)",
              }}
            >
              {plan.featured && !isCurrent && (
                <span className="badge badge-green">Popular</span>
              )}
              {isActive  && <span className="badge badge-blue">Active</span>}
              {isPending && <span className="badge badge-yellow">Pending</span>}

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
                className="btn btn-primary"
                style={{ width: "100%" }}
                disabled={isActive || loading === plan.id}
                onClick={() => handleSubscribe(plan.id)}
              >
                {isActive
                  ? "Active Plan"
                  : loading === plan.id
                  ? "Processing..."
                  : isPending
                  ? "Retry Payment"
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