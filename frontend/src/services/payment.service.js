import api from '../app/api'

export const createOrder = (bookingId) =>
  api.post('/payments/create-order', { bookingId }).then((r) => r.data)

export const verifyPayment = (data) =>
  api.post('/payments/verify', data).then((r) => r.data)
