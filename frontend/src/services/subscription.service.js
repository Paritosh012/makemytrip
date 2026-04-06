import api from '../app/api'

export const purchaseSubscription = (plan) =>
  api.post('/subscriptions/purchase', { plan }).then((r) => r.data)
