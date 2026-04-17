import { useEffect, useState } from "react";
import * as subscriptionService from "../../services/subscription.service";

const formatDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const statusBadge = (status) => {
  const map = {
    ACTIVE: "badge-green",
    PENDING: "badge-yellow",
    CANCELLED: "badge-red",
    EXPIRED: "badge-muted",
  };

  return (
    <span className={`badge ${map[status] || "badge-yellow"}`}>{status}</span>
  );
};

const ManageSubscription = () => {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [curRes, histRes] = await Promise.all([
        subscriptionService.getMySubscription(),
      ]);

      setCurrent(curRes?.data || null);
      setHistory(histRes?.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load subscription",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = async () => {
    if (!window.confirm("Cancel current subscription?")) return;

    try {
      setActionLoading(true);
      await subscriptionService.cancelSubscription();
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Cancel failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-wrap">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Manage Subscription</h1>
        <p>View current plan and billing history</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ================= CURRENT ================= */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h2>Current Subscription</h2>
        </div>

        {!current ? (
          <div className="text-muted">No active subscription</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="flex-between">
              <span className="text-muted">Plan</span>
              <strong>{current.plan}</strong>
            </div>

            <div className="flex-between">
              <span className="text-muted">Status</span>
              {statusBadge(current.status)}
            </div>

            <div className="flex-between">
              <span className="text-muted">Start Date</span>
              <span>{formatDate(current.startDate)}</span>
            </div>

            <div className="flex-between">
              <span className="text-muted">Next Cycle Date</span>
              <span>{formatDate(current.endDate)}</span>
            </div>

            <div className="flex-between">
              <span className="text-muted">Razorpay ID</span>
              <span style={{ fontSize: 12 }}>
                {current.razorpaySubscriptionId || "—"}
              </span>
            </div>

            {current.status === "ACTIVE" && (
              <button
                className="btn btn-danger"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                {actionLoading ? "Cancelling..." : "Cancel Subscription"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSubscription;
