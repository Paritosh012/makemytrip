import { useEffect, useState } from "react";
import * as hostService from "../../services/host.service";
import { useAuth } from "../../hooks/useAuth";

const statusBadge = (status) => {
  const map = {
    PENDING: "badge-yellow",
    APPROVED: "badge-green",
    REJECTED: "badge-red",
    PROCESSING: "badge-blue",
  };
  return (
    <span className={`badge ${map[status] || "badge-gray"}`}>{status}</span>
  );
};

const Applications = () => {
  const { user } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [filter, setFilter] = useState("");
  const [toast, setToast] = useState(null);

  // 🔥 PERMISSION CHECK (FIXED)
  if (
    user?.role !== "SUPER_ADMIN" &&
    !user.permissions?.includes("APPROVE_HOSTS")
  ) {
    return <h2>Access Denied</h2>;
  }

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
    if (user) fetchApplications();
  }, [filter, user]);

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
        <h1>Host Applications</h1>
        <p>Review and process incoming host applications</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* FILTER */}
      <div style={{ marginBottom: 16 }}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Applications</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : applications.length === 0 ? (
        <p>No applications found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Agency</th>
              <th>Applicant</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {applications.map((app) => (
              <tr key={app._id}>
                <td>{app.agencyName}</td>

                <td>
                  {app.userId?.name}
                  <br />
                  {app.userId?.email}
                </td>

                <td>{statusBadge(app.status)}</td>

                <td>{new Date(app.createdAt).toLocaleDateString("en-IN")}</td>

                <td>
                  {app.status === "PENDING" && (
                    <>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Applications;
