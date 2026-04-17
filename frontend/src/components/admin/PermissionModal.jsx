import { useState } from "react";
import * as adminService from "../../features/admin/admin.service";

const ALL_PERMISSIONS = [
  "VIEW_USERS",
  "MANAGE_USERS",
  "VIEW_TENANTS",
  "MANAGE_TENANTS",
  "APPROVE_HOSTS",
];

export default function PermissionModal({ user, onClose, onSuccess }) {
  const [selected, setSelected] = useState(user.permissions || []);

  const togglePermission = (perm) => {
    if (selected.includes(perm)) {
      setSelected(selected.filter((p) => p !== perm));
    } else {
      setSelected([...selected, perm]);
    }
  };

  const handleSubmit = async () => {
    await adminService.updatePermissions(user._id, selected);
    onSuccess();
    onClose();
  };

  return (
    <div className="modal">
      <h3>Edit Permissions</h3>

      {ALL_PERMISSIONS.map((perm) => (
        <div key={perm}>
          <input
            type="checkbox"
            checked={selected.includes(perm)}
            onChange={() => togglePermission(perm)}
          />
          <label>{perm}</label>
        </div>
      ))}

      <button onClick={handleSubmit}>Save</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
}
