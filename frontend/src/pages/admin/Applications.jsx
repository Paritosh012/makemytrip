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

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await hostService.approveApplication(id);
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject this application?")) return;

    setActionId(id);
    try {
      await hostService.rejectApplication(id);
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div>
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
