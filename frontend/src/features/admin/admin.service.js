import api from "../../app/api";

// TENANT APIS

export const getTenants = () => api.get("/admin/tenants").then((r) => r.data);

export const getOneTenant = (id) =>
  api.get(`/admin/tenants/${id}`).then((r) => r.data);

export const suspendTenant = (id) =>
  api.patch(`/admin/tenants/${id}/suspend`).then((r) => r.data);

export const activateTenant = (id) =>
  api.patch(`/admin/tenants/${id}/activate`).then((r) => r.data);

export const updateTenantPlan = (id, plan) =>
  api.patch(`/admin/tenants/${id}/plan`, { plan }).then((r) => r.data);

// USER APIS

export const getUsers = () => api.get("/admin/users").then((r) => r.data);

export const promoteToAdmin = (id) =>
  api.patch(`/admin/users/${id}/promote`).then((r) => r.data);

export const updateUserPermissions = (id, permissions) =>
  api
    .patch(`/admin/users/${id}/permissions`, { permissions })
    .then((r) => r.data);

export const toggleSuspend = (id) =>
  api.patch(`/admin/users/${id}/suspend`).then((r) => r.data);
