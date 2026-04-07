import api from "../app/api";

export const purchaseSubscription = (planId) =>
  api.post("/subscriptions/purchase", { plan: planId }).then((res) => res.data);

export const getMySubscription = () =>
  api.get("/subscriptions/me").then((res) => res.data);
