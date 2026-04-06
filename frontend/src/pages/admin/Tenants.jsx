import { useEffect, useState } from "react";
import * as adminService from "../../services/admin.service";
import { useAuth } from "../../hooks/useAuth";

const statusBadge = (status) => {
  const map = {
    ACTIVE: "badge-green",
    SUSPENDED: "badge-red",
    PENDING: "badge-yellow",
  };
  return (
    <span className={`badge ${map[status] || "badge-gray"}`}>{status}</span>
  );
};

const PLANS = ["BASIC", "PRO", "PREMIUM"];

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [planModal, setPlanModal] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("");

  const fetchTenants = () => {
    setLoading(true);
    adminService
      .getTenants()
      .then((data) => setTenants(data.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      fetchTenants();
    }
  }, [user]);

  const handleSuspend = async (id) => {
    if (!window.confirm("Suspend this tenant?")) return;
    setActionId(id);
    try {
      await adminService.suspendTenant(id);
      fetchTenants();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleActivate = async (id) => {
    setActionId(id);
    try {
      await adminService.activateTenant(id);
      fetchTenants();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handlePlanUpdate = async () => {
    if (!selectedPlan) return;
    setActionId(planModal._id);
    try {
      await adminService.updateTenantPlan(planModal._id, selectedPlan);
      setPlanModal(null);
      setSelectedPlan("");
      fetchTenants();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  if (user?.role !== "SUPER_ADMIN") {
    return <h2>Access Denied</h2>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Tenant Management</h1>
        <p>Manage all tenant accounts on the platform</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loader-wrap">
          <div className="spinner" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏢</div>
          <p>No tenants yet</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t._id}>
                    <td style={{ fontWeight: 500 }}>{t.name}</td>
                    <td>
                      <div>{t.ownerId?.name}</div>
                      <div className="text-muted">{t.ownerId?.email}</div>
                    </td>
                    <td>{statusBadge(t.status)}</td>
                    <td>
                      {t.subscriptionId?.plan ? (
                        <span className="badge badge-blue">
                          {t.subscriptionId.plan}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-muted">
                      {new Date(t.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      <div className="actions-row">
                        {t.status !== "SUSPENDED" ? (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleSuspend(t._id)}
                            disabled={actionId === t._id}
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleActivate(t._id)}
                            disabled={actionId === t._id}
                          >
                            Activate
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setPlanModal(t);
                            setSelectedPlan(t.subscriptionId?.plan || "");
                          }}
                        >
                          Plan
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plan Update Modal */}
      {planModal && (
        <div className="modal-overlay" onClick={() => setPlanModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Update Plan — {planModal.name}</h2>
            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Select Plan</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
              >
                <option value="">Choose plan...</option>
                {PLANS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="actions-row">
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handlePlanUpdate}
                disabled={!selectedPlan || actionId === planModal._id}
              >
                {actionId === planModal._id ? "Updating..." : "Update Plan"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setPlanModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenants;
