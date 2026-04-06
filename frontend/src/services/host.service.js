import api from '../app/api'

export const submitApplication = (data) =>
  api.post('/host-applications', data).then((r) => r.data)

export const getApplications = (status) =>
  api.get('/host-applications', { params: status ? { status } : {} }).then((r) => r.data)

export const approveApplication = (id) =>
  api.patch(`/host-applications/${id}/approve`).then((r) => r.data)

export const rejectApplication = (id) =>
  api.patch(`/host-applications/${id}/reject`).then((r) => r.data)
