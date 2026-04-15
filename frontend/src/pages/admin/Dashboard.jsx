import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as hostService from "../../services/host.service";
import * as adminService from "../../features/admin/admin.service";
import { useAuth } from "../../hooks/useAuth";

const AdminDashboard = () => {
  const { user } = useAuth();

  const [applications, setApplications] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);

  // 🔥 PERMISSION CHECK (FIXED)
  if (
    (user?.role !== "SUPER_ADMIN" &&
      user.permissions?.includes("VIEW_TENANTS")) ||
    (user?.role !== "SUPER_ADMIN" &&
      user.permissions?.includes("APPROVE_HOSTS"))
  ) {
    return <h2>Access Denied</h2>;
  }

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const [appData, tenantData] = await Promise.all([
        hostService.getApplications("PENDING"),
        adminService.getTenants(),
      ]);

      // ✅ FIXED RESPONSE HANDLING
      setApplications(appData || []);
      setTenants(tenantData || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await hostService.approveApplication(id);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
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
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionId(null);
    }
  };

  // 🔥 SAFE CALCULATIONS
  const pending = applications.length;
  const active = tenants.filter((t) => t.status === "ACTIVE").length;
  const suspended = tenants.filter((t) => t.status === "SUSPENDED").length;

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview and host management</p>
      </div>

      {/* STATS */}
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
        {/* APPLICATIONS */}
        <div className="card">
          <div className="card-header">
            <h2>Pending Applications</h2>
            <Link to="/admin/applications">View all</Link>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : applications.length === 0 ? (
            <p>No pending applications</p>
          ) : (
            applications.slice(0, 5).map((app) => (
              <div key={app._id}>
                <div>{app.agencyName}</div>
                <div>{app.userId?.email}</div>

                <button
                  onClick={() => handleApprove(app._id)}
                  disabled={actionId === app._id}
                >
                  Approve
                </button>

                <button
                  onClick={() => handleReject(app._id)}
                  disabled={actionId === app._id}
                >
                  Reject
                </button>
              </div>
            ))
          )}
        </div>

        {/* TENANTS */}
        <div className="card">
          <div className="card-header">
            <h2>Recent Tenants</h2>
            <Link to="/admin/tenants">View all</Link>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : tenants.length === 0 ? (
            <p>No tenants yet</p>
          ) : (
            tenants.slice(0, 5).map((t) => (
              <div key={t._id}>
                <div>{t.name}</div>
                <div>{t.ownerId?.email}</div>
                <span>{t.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
