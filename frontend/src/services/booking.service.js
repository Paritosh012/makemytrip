import api from "../app/api";

export const createBooking = (data) =>
  api.post("/bookings", data).then((res) => res.data);

export const getBookings = () => api.get("/bookings").then((res) => res.data);

export const cancelBooking = (bookingId) =>
  api.patch(`/bookings/${bookingId}/cancel`).then((res) => res.data);
