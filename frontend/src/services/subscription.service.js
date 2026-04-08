import api from "../app/api";

export const purchaseSubscription = (planId) =>
  api.post("/subscriptions/purchase", { plan: planId }).then((res) => res.data);

export const getMySubscription = () =>
  api.get("/subscriptions/me").then((res) => res.data);

export const createSubscriptionOrder = (plan) =>
  api.post("/subscriptions/create-order", { plan }).then((r) => r.data);

export const verifySubscriptionPayment = (data) =>
  api.post("/subscriptions/verify", data).then((r) => r.data);
