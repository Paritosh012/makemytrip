import api from "../app/api";

// ================= GET =================

export const getMySubscription = async () => {
  const res = await api.get("/subscriptions/me");
  return res.data;
};
 

// ================= CREATE =================

export const createSubscription = async (plan) => {
  const res = await api.post("/subscriptions/create", { plan });
  return res.data;
};

// ================= VERIFY =================

export const verifySubscriptionPayment = async (data) => {
  const res = await api.post("/subscriptions/verify", data);
  return res.data;
};

// ================= CANCEL =================

export const cancelSubscription = async () => {
  try {
    const res = await api.post("/subscriptions/cancel");
    return res.data;
  } catch (err) {
    console.error(
      "Cancel subscription failed:",
      err.response?.data || err.message,
    );
    throw err;
  }
};
