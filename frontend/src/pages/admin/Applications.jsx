import { useEffect, useState } from "react";
import * as hostService from "../../services/host.service";

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
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [filter, setFilter] = useState("");

  const fetchApplications = () => {
    setLoading(true);
    hostService
      .getApplications(filter || undefined)
      .then((data) => setApplications(data.data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await hostService.approveApplication(id);
      fetchApplications();
    } catch (err) {
      setError(err.message);
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
      setError(err.message);
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

      <div style={{ marginBottom: 16 }}>
        <select
          className="form-group"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "9px 14px",
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            color: "var(--text)",
            fontSize: 14,
          }}
        >
          <option value="">All Applications</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="loader-wrap">
          <div className="spinner" />
        </div>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>No applications found</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Agency</th>
                  <th>Applicant</th>
                  <th>Business Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id}>
                    <td style={{ fontWeight: 500 }}>{app.agencyName}</td>
                    <td>
                      <div>{app.userId?.name}</div>
                      <div className="text-muted">{app.userId?.email}</div>
                    </td>
                    <td className="text-muted">{app.businessEmail}</td>
                    <td className="text-muted">{app.phone}</td>
                    <td>{statusBadge(app.status)}</td>
                    <td className="text-muted">
                      {new Date(app.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      {app.status === "PENDING" && (
                        <div className="actions-row">
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
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
