import api from '../app/api'

export const getTenants = () =>
  api.get('/tenants').then((r) => r.data)

export const getOneTenant = (id) =>
  api.get(`/tenants/${id}`).then((r) => r.data)

export const suspendTenant = (id) =>
  api.patch(`/tenants/${id}/suspend`).then((r) => r.data)

export const activateTenant = (id) =>
  api.patch(`/tenants/${id}/activate`).then((r) => r.data)

export const updateTenantPlan = (id, plan) =>
  api.patch(`/tenants/${id}/plan`, { plan }).then((r) => r.data)
