  import api from "../../app/api";

  // ================= USERS =================

  export const getUsers = (params = {}) =>
    api.get("/admin/users", { params }).then((r) => r.data);

  export const promoteToAdmin = (userId) =>
    api.patch(`/admin/users/${userId}/promote`).then((r) => r.data);

  export const updatePermissions = (userId, permissions) =>
    api
      .patch(`/admin/users/${userId}/permissions`, { permissions })
      .then((r) => r.data);

  export const toggleSuspend = (userId) =>
    api.patch(`/admin/users/${userId}/suspend`).then((r) => r.data);

  // ================= TENANTS =================

  // 🔥 THIS IS WHAT YOU ARE MISSING

  export const getTenants = (params = {}) =>
    api.get("/admin/tenants", { params }).then((r) => r.data);

  export const getTenant = (tenantId) =>
    api.get(`/admin/tenants/${tenantId}`).then((r) => r.data);

  export const suspendTenant = (tenantId) =>
    api
      .patch(`/admin/tenants/${tenantId}/suspend`)
      .then((r) => r.data);

  export const activateTenant = (tenantId) =>
    api
      .patch(`/admin/tenants/${tenantId}/activate`)
      .then((r) => r.data);

  export const updateTenantPlan = (tenantId, plan) =>
    api
      .patch(`/admin/tenants/${tenantId}/plan`, { plan })
      .then((r) => r.data);