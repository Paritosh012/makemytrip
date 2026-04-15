import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import UsersTable from "../../components/admin/UsersTable";
import PermissionModal from "../../components/admin/PermissionModal";

import { fetchUsers } from "../../features/admin/adminSlice";

export default function Users() {
  const dispatch = useDispatch();

  const { users, loading } = useSelector((state) => state.admin);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleEditPermissions = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  const handleRefresh = () => {
    dispatch(fetchUsers());
  };

  return (
    <div>
      <h2>Users Management</h2>

      <UsersTable
        users={users}
        loading={loading}
        onEditPermissions={handleEditPermissions}
        onRefresh={handleRefresh}
      />

      {isModalOpen && (
        <PermissionModal
          user={selectedUser}
          onClose={handleCloseModal}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
