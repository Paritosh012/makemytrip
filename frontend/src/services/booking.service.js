import api from "../app/api";

export const createBooking = (data) =>
  api.post("/bookings", data).then((r) => r.data);

export const getBookings = () =>
  api.get("/bookings").then((r) => r.data);

export const cancelBooking = (bookingId) =>
  api.patch(`/bookings/${bookingId}/cancel`).then((r) => r.data);