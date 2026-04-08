import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import * as packageService from "../../services/package.service";
import * as subscriptionService from "../../services/subscription.service";

const HostDashboard = () => {
  const { user } = useAuth();

  const [packages, setPackages] = useState([]);
  const [subscription, setSubscription] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "HOST") return;

    const init = async () => {
      try {
        // 🔥 1. Get subscription FIRST
        const subRes = await subscriptionService.getMySubscription();
        const sub = subRes.data || null;
        setSubscription(sub);

        // 🔥 2. Only fetch packages if allowed
        if (sub?.status === "ACTIVE") {
          const pkgRes = await packageService.getPackages();
          setPackages(pkgRes.data || []);
        } else {
          setPackages([]); // prevent crash
        }
      } catch (err) {
        setError(err.message);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [user]);

  if (user?.role !== "HOST") {
    return <h2>Access Denied</h2>;
  }

  const isActive = subscription?.status === "ACTIVE";

  const active = packages.filter((p) => p.status === "ACTIVE").length;
  const draft = packages.filter((p) => p.status === "DRAFT").length;
  const archived = packages.filter((p) => p.status === "ARCHIVED").length;

  return (
    <div>
      <div className="page-header">
        <h1>Host Dashboard</h1>
        <p>Welcome back, {user?.name}</p>
      </div>

      {/* 🔥 STATUS ALERT */}
      {!isActive && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          Tenant not activated. Please purchase a plan.
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {/* 🔥 STATS */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-label">Total Packages</div>
          <div className="stat-value">{loading ? "—" : packages.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value" style={{ color: "var(--accent2)" }}>
            {loading ? "—" : active}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Drafts</div>
          <div className="stat-value" style={{ color: "var(--warning)" }}>
            {loading ? "—" : draft}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Archived</div>
          <div className="stat-value" style={{ color: "var(--muted)" }}>
            {loading ? "—" : archived}
          </div>
        </div>
      </div>

      {/* 🔥 ACTIONS */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2>Quick Actions</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {isActive ? (
              <Link to="/host/create-package" className="btn btn-primary">
                + Create New Package
              </Link>
            ) : (
              <Link to="/host/subscription" className="btn btn-primary">
                Activate Subscription
              </Link>
            )}

            <Link to="/host/packages" className="btn btn-secondary">
              View All Packages
            </Link>

            <Link to="/host/subscription" className="btn btn-secondary">
              Manage Subscription
            </Link>
          </div>
        </div>

        {/* 🔥 ACCOUNT INFO */}
        <div className="card">
          <div className="card-header">
            <h2>Account Info</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["Name", user?.name],
              ["Email", user?.email],
              ["Role", user?.role],
              [
                "Tenant ID",
                user?.tenantId
                  ? user.tenantId.slice(-8) + "..."
                  : "Not assigned",
              ],
              ["Plan", subscription?.plan || "Not Subscribed"],
            ].map(([label, val]) => (
              <div key={label} className="flex-between">
                <span className="text-muted">{label}</span>
                <span>{val || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;
