import api from "../app/api";

export const createOrder = (bookingId) =>
  api.post("/payments/create-order", { bookingId }).then((res) => res.data);

export const verifyPayment = (data) =>
  api.post("/payments/verify", data).then((res) => res.data);
