import { useEffect, useState } from "react";
import * as adminService from "../../features/admin/admin.service";
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
  const { user } = useAuth();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [planModal, setPlanModal] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("");

  // 🔥 PERMISSION CHECK (FIXED)
  if (
    user?.role !== "SUPER_ADMIN" &&
    !user?.permissions?.includes("VIEW_TENANTS")
  ) {
    return <h2>Access Denied</h2>;
  }

  const fetchTenants = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await adminService.getTenants();

      // ✅ FIXED (no double .data)
      setTenants(data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchTenants();
  }, [user]);

  const handleSuspend = async (id) => {
    if (!window.confirm("Suspend this tenant?")) return;

    setActionId(id);
    try {
      await adminService.suspendTenant(id);
      fetchTenants();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
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
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionId(null);
    }
  };

  const handlePlanUpdate = async () => {
    if (!selectedPlan || !planModal) return;

    setActionId(planModal._id);
    try {
      await adminService.updateTenantPlan(planModal._id, selectedPlan);

      setPlanModal(null);
      setSelectedPlan("");
      fetchTenants();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Tenant Management</h1>
        <p>Manage all tenant accounts</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : tenants.length === 0 ? (
        <div>No tenants found</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {tenants.map((t) => (
              <tr key={t._id}>
                <td>{t.name}</td>
                <td>{statusBadge(t.status)}</td>
                <td>{t.subscriptionId?.plan || "—"}</td>

                <td>
                  {t.status !== "SUSPENDED" ? (
                    <button onClick={() => handleSuspend(t._id)}>
                      Suspend
                    </button>
                  ) : (
                    <button onClick={() => handleActivate(t._id)}>
                      Activate
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setPlanModal(t);
                      setSelectedPlan(t.subscriptionId?.plan || "");
                    }}
                  >
                    Plan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* PLAN MODAL */}
      {planModal && (
        <div>
          <h3>Update Plan</h3>

          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
          >
            <option value="">Select</option>
            {PLANS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>

          <button onClick={handlePlanUpdate}>
            {actionId === planModal._id ? "Updating..." : "Update"}
          </button>

          <button onClick={() => setPlanModal(null)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default Tenants;
