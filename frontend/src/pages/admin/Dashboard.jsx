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
  const [filter, setFilter] = useState("");
  const [toast, setToast] = useState(null);

  // 🔥 PERMISSION CHECK (FIXED)
  if (
    (user?.role !== "SUPER_ADMIN" &&
      user.permissions?.includes("VIEW_TENANTS")) ||
    (user?.role !== "SUPER_ADMIN" &&
      user.permissions?.includes("APPROVE_HOSTS"))
  ) {
    return <h2>Access Denied</h2>;
  }

  const fetchTenants = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await adminService.getTenants();

      const tenantsArr = Array.isArray(data)
        ? data
        : data?.data?.tenants || data?.data || data?.tenants || [];

      setTenants(tenantsArr);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await hostService.getApplications(filter || undefined);

      setApplications(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTenants();
      fetchApplications();
    }
  }, [user]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await hostService.approveApplication(id);
      setToast({ type: "success", message: "Application approved" });
      fetchApplications();
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject this application?")) return;

    setActionId(id);
    try {
      await hostService.rejectApplication(id);
      setToast({ type: "error", message: "Application rejected" });
      fetchApplications();
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setActionId(null);
    }
  };

  const pendingApplications = applications.filter(
    (app) => app.status === "PENDING",
  );

  // 🔥 SAFE CALCULATIONS
  const pending = pendingApplications.length;
  const active = tenants.filter((t) => t.status === "ACTIVE").length;
  const suspended = tenants.filter((t) => t.status === "SUSPENDED").length;

  return (
    <div>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: "12px 18px",
            borderRadius: "8px",
            background: toast.type === "success" ? "#16a34a" : "#dc2626",
            color: "#fff",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          }}
        >
          {toast.message}
        </div>
      )}
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
          ) : pendingApplications.length === 0 ? (
            <p>No pending applications</p>
          ) : (
            pendingApplications.slice(0, 5).map((app) => (
              <div key={app._id}>
                {app.status === "PENDING" && (
                  <>
                    <div>{app.agencyName}</div>
                    <div>{app.userId?.email}</div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-success btn-sm"
                        disabled={actionId === app._id}
                        onClick={() => handleApprove(app._id)}
                      >
                        {actionId === app._id ? "Processing..." : "Approve"}
                      </button>

                      <button
                        className="btn btn-outline-danger btn-sm"
                        disabled={actionId === app._id}
                        onClick={() => handleReject(app._id)}
                      >
                        {actionId === app._id ? "Processing..." : "Reject"}
                      </button>
                    </div>
                  </>
                )}
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
