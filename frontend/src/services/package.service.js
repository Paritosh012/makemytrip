import api from '../app/api'

export const createPackage = (data) =>
  api.post('/packages', data).then((r) => r.data)

export const getPackages = (params) =>
  api.get('/packages', { params }).then((r) => r.data)

export const getPackage = (id) =>
  api.get(`/packages/${id}`).then((r) => r.data)

export const updatePackage = (id, data) =>
  api.patch(`/packages/${id}`, data).then((r) => r.data)

export const deletePackage = (id) =>
  api.delete(`/packages/${id}`).then((r) => r.data)

// Public: for end users browsing
export const getPublicPackages = (params) =>
  api.get('/packages/public', { params }).then((r) => r.data)
