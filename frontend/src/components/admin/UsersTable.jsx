import * as adminService from "../../features/admin/admin.service";

export default function UsersTable({
  users,
  loading,
  onEditPermissions,
  onRefresh,
}) {
  const handlePromote = async (userId) => {
    await adminService.promoteToAdmin(userId);
    onRefresh();
  };

  const handleSuspend = async (userId) => {
    await adminService.toggleSuspend(userId);
    onRefresh();
  };

  if (loading) return <p>Loading...</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {users.map((user) => (
          <tr key={user._id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>{user.isSuspended ? "Suspended" : "Active"}</td>

            <td>
              {user.role !== "ADMIN" && (
                <button onClick={() => handlePromote(user._id)}>Promote</button>
              )}

              <button onClick={() => onEditPermissions(user)}>
                Permissions
              </button>

              <button onClick={() => handleSuspend(user._id)}>
                {user.isSuspended ? "Activate" : "Suspend"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
