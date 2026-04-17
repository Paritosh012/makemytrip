import { useEffect, useState } from "react";
import * as adminService from "../../features/admin/admin.service";
import { useAuth } from "../../hooks/useAuth";

const PLANS = ["BASIC", "PRO", "PREMIUM"];

const Tenants = () => {
  const { user } = useAuth();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);

  const [planModal, setPlanModal] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("");

  const [toast, setToast] = useState(null);

  // 🔐 AUTH
  if (!user) return <div>Loading...</div>;

  const hasAccess =
    user.role === "SUPER_ADMIN" ||
    user.permissions?.includes("VIEW_TENANTS");

  if (!hasAccess) return <h2>Access Denied</h2>;

  // 📦 FETCH
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

  useEffect(() => {
    fetchTenants();
  }, []);

  // 🔔 TOAST AUTO HIDE
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // 🔥 ACTIONS
  const handleSuspend = async (id) => {
    if (!window.confirm("Suspend this tenant?")) return;

    setActionId(id);
    try {
      await adminService.suspendTenant(id);
      setToast({ type: "error", msg: "Tenant suspended" });
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
      setToast({ type: "success", msg: "Tenant activated" });
      fetchTenants();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handlePlanUpdate = async () => {
    if (!selectedPlan || !planModal) return;

    // 🔒 HARD BLOCK
    if (planModal.status !== "ACTIVE") {
      setToast({
        type: "error",
        msg: "Only ACTIVE tenants can have plans",
      });
      return;
    }

    setActionId(planModal._id);
    try {
      await adminService.updateTenantPlan(planModal._id, selectedPlan);

      setToast({ type: "success", msg: "Plan updated" });

      setPlanModal(null);
      setSelectedPlan("");
      fetchTenants();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionId(null);
    }
  };

  // 🎨 STATUS COLOR
  const getStatusClass = (status) => {
    switch (status) {
      case "ACTIVE":
        return "badge-green";
      case "SUSPENDED":
        return "badge-red";
      default:
        return "badge-yellow";
    }
  };

  return (
    <div className="tenants-page">
      {/* 🔔 TOAST */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            padding: "12px 18px",
            borderRadius: 8,
            background: toast.type === "success" ? "#16a34a" : "#dc2626",
            color: "#fff",
            zIndex: 999,
          }}
        >
          {toast.msg}
        </div>
      )}

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
        <div className="tenant-grid">
          {tenants.map((t) => {
            const isInactive = t.status !== "ACTIVE";

            return (
              <div className="tenant-card premium" key={t._id}>
                {/* HEADER */}
                <div className="tenant-header">
                  <div>
                    <h3>{t.name}</h3>
                    <span className={`badge ${getStatusClass(t.status)}`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="plan">
                    {t.subscriptionId?.plan || "No Plan"}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="tenant-actions">
                  {t.status === "SUSPENDED" ? (
                    <button
                      className="btn btn-success"
                      onClick={() => handleActivate(t._id)}
                      disabled={actionId === t._id}
                    >
                      Activate
                    </button>
                  ) : (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleSuspend(t._id)}
                      disabled={actionId === t._id}
                    >
                      Suspend
                    </button>
                  )}

                  <button
                    className="btn btn-outline"
                    disabled={isInactive}
                    title={
                      isInactive
                        ? "Tenant must be ACTIVE to assign plan"
                        : ""
                    }
                    onClick={() => {
                      if (isInactive) return;

                      setPlanModal(t);
                      setSelectedPlan(t.subscriptionId?.plan || "");
                    }}
                  >
                    Plan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🔥 MODAL */}
      {planModal && (
        <div className="modal-overlay">
          <div className="modal premium">
            <h2>Update Plan</h2>

            <select
              className="form-select"
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
            >
              {PLANS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>

            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={handlePlanUpdate}
                disabled={actionId === planModal._id}
              >
                {actionId === planModal._id ? "Updating..." : "Update"}
              </button>

              <button
                className="btn btn-outline"
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