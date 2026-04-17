import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as adminService from "../../features/admin/admin.service";
import { fetchUsers } from "../../features/admin/adminSlice";

export default function Users() {
  const dispatch = useDispatch();
  const { users = [], loading } = useSelector((state) => state.admin || {});

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // 🔥 TOAST SYSTEM
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // 🔥 FILTER LOGIC
  const filteredUsers = users
    .filter((u) => {
      const q = search.toLowerCase();
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    })
    .filter((u) => (roleFilter ? u.role === roleFilter : true));

  // 🔥 PROMOTE (ONLY VERIFIED USERS)
  const handlePromote = async (user) => {
    if (actionLoading) return;

    if (!user.isVerified) {
      return showToast("User must be verified first", "error");
    }

    if (!window.confirm("Promote this user to ADMIN?")) return;

    setActionLoading(user._id);

    try {
      await adminService.promoteToAdmin(user._id);
      showToast("User promoted to ADMIN");
      dispatch(fetchUsers());
    } catch (err) {
      showToast(err.response?.data?.message || "Failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // 🔥 TOGGLE SUSPEND (FIXED)
  const handleToggleSuspend = async (user) => {
    if (actionLoading === user._id) return;

    const msg = user.isSuspended
      ? "Activate this user?"
      : "Suspend this user?";

    if (!window.confirm(msg)) return;

    setActionLoading(user._id);

    try {
      await adminService.toggleSuspend(user._id);

      showToast(
        user.isSuspended ? "User activated" : "User suspended"
      );

      dispatch(fetchUsers());
    } catch (err) {
      showToast(err.response?.data?.message || "Failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // 🔥 SAVE PERMISSIONS
  const handleSavePermissions = async () => {
    try {
      await adminService.updatePermissions(
        selectedUser._id,
        selectedPermissions
      );

      showToast("Permissions updated");
      setSelectedUser(null);
      dispatch(fetchUsers());
    } catch (err) {
      showToast("Failed to update permissions", "error");
    }
  };

  return (
    <div className="page">
      {/* HEADER */}
      <div className="page-header">
        <h1>Users Management</h1>
        <p>Manage roles, access and system control</p>
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <input
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="END_USER">End User</option>
          <option value="HOST">Host</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="card">
        {loading ? (
          <div className="center">Loading...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="center">No users found</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id}>
                  {/* USER */}
                  <td>
                    <div className="user-cell">
                      <div className="avatar">
                        {u.name?.charAt(0)}
                      </div>
                      <div>
                        <div className="name">{u.name}</div>
                        <div className="email">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* ROLE */}
                  <td>
                    <span className={`badge role-${u.role}`}>
                      {u.role}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td>
                    <div className="status-stack">
                      <span
                        className={`badge ${
                          u.isSuspended
                            ? "badge-red"
                            : "badge-green"
                        }`}
                      >
                        {u.isSuspended ? "Suspended" : "Active"}
                      </span>

                      <span
                        className={`badge ${
                          u.isVerified
                            ? "badge-blue"
                            : "badge-yellow"
                        }`}
                      >
                        {u.isVerified
                          ? "Verified"
                          : "Unverified"}
                      </span>
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td className="actions">
                    {/* PROMOTE */}
                    {u.role === "END_USER" && (
                      <button
                        className="btn btn-primary"
                        disabled={
                          actionLoading === u._id ||
                          !u.isVerified
                        }
                        onClick={() => handlePromote(u)}
                      >
                        {!u.isVerified
                          ? "Verify Required"
                          : "Promote"}
                      </button>
                    )}

                    {/* PERMISSIONS (ONLY ADMIN) */}
                    {u.role === "ADMIN" && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setSelectedUser(u);
                          setSelectedPermissions(
                            u.permissions || []
                          );
                        }}
                      >
                        Permissions
                      </button>
                    )}

                    {/* SUSPEND / ACTIVATE */}
                    {u.role !== "SUPER_ADMIN" && (
                      <button
                        className={`btn ${
                          u.isSuspended
                            ? "btn-secondary"
                            : "btn-danger"
                        }`}
                        disabled={actionLoading === u._id}
                        onClick={() =>
                          handleToggleSuspend(u)
                        }
                      >
                        {actionLoading === u._id
                          ? "Processing..."
                          : u.isSuspended
                          ? "Activate"
                          : "Suspend"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PERMISSION MODAL */}
      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Edit Permissions</h3>

            <div className="permissions-grid">
              {[
                "VIEW_USERS",
                "MANAGE_USERS",
                "VIEW_TENANTS",
                "MANAGE_TENANTS",
                "APPROVE_HOSTS",
              ].map((perm) => (
                <label key={perm}>
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm)}
                    onChange={() =>
                      setSelectedPermissions((prev) =>
                        prev.includes(perm)
                          ? prev.filter((p) => p !== perm)
                          : [...prev, perm]
                      )
                    }
                  />
                  {perm}
                </label>
              ))}
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={handleSavePermissions}
              >
                Save
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setSelectedUser(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}