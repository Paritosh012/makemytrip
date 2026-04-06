import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as hostService from "../../services/host.service";
import * as adminService from "../../services/admin.service";
import { useAuth } from "../../hooks/useAuth";

const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appData, tenantData] = await Promise.all([
        hostService.getApplications("PENDING"),
        adminService.getTenants(),
      ]);
      setApplications(appData.data || []);
      setTenants(tenantData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      fetchData();
    }
  }, [user]);

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await hostService.approveApplication(id);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    setActionId(id);
    try {
      await hostService.rejectApplication(id);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  const pending = applications.length;
  const active = tenants.filter((t) => t.status === "ACTIVE").length;
  const suspended = tenants.filter((t) => t.status === "SUSPENDED").length;

  if (user?.role !== "SUPER_ADMIN") {
    return <h2>Access Denied</h2>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview and host management</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-label">Pending Applications</div>
          <div className="stat-value" style={{ color: "var(--warning)" }}>
            {loading ? "—" : pending}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Tenants</div>
          <div className="stat-value">{loading ? "—" : tenants.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Tenants</div>
          <div className="stat-value" style={{ color: "var(--accent2)" }}>
            {loading ? "—" : active}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Suspended</div>
          <div className="stat-value" style={{ color: "var(--danger)" }}>
            {loading ? "—" : suspended}
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-2">
        {/* Pending Applications */}
        <div className="card">
          <div className="card-header">
            <h2>Pending Applications</h2>
            <Link
              to="/admin/applications"
              style={{ fontSize: 13, color: "var(--accent)" }}
            >
              View all
            </Link>
          </div>
          {loading ? (
            <div className="loader-wrap">
              <div className="spinner" />
            </div>
          ) : applications.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <p>No pending applications</p>
            </div>
          ) : (
            applications.slice(0, 5).map((app) => (
              <div
                key={app._id}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: 2 }}>
                  {app.agencyName}
                </div>
                <div className="text-muted">{app.userId?.email}</div>
                <div className="actions-row" style={{ marginTop: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: "auto" }}
                    onClick={() => handleApprove(app._id)}
                    disabled={actionId === app._id}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleReject(app._id)}
                    disabled={actionId === app._id}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Tenants */}
        <div className="card">
          <div className="card-header">
            <h2>Recent Tenants</h2>
            <Link
              to="/admin/tenants"
              style={{ fontSize: 13, color: "var(--accent)" }}
            >
              View all
            </Link>
          </div>
          {loading ? (
            <div className="loader-wrap">
              <div className="spinner" />
            </div>
          ) : tenants.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <p>No tenants yet</p>
            </div>
          ) : (
            tenants.slice(0, 5).map((t) => (
              <div
                key={t._id}
                className="flex-between"
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{t.name}</div>
                  <div className="text-muted">{t.ownerId?.email}</div>
                </div>
                <span
                  className={`badge ${t.status === "ACTIVE" ? "badge-green" : t.status === "SUSPENDED" ? "badge-red" : "badge-yellow"}`}
                >
                  {t.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
