import api from "../app/api";

export const getMySubscription = () =>
  api.get("/subscriptions/me").then((r) => r.data);

export const createSubscription = (plan) =>
  api.post("/subscriptions/create", { plan }).then((r) => r.data);

export const verifySubscriptionPayment = (data) =>
  api.post("/subscriptions/verify", data).then((r) => r.data);

export const getHistory = () =>
  api.get("/subscriptions/history").then((r) => r.data);

export const cancelSubscription = () =>
  api.post("/subscriptions/cancel").then((r) => r.data);
