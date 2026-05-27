import api from "../app/api";

export const register = (data) =>
  api.post("/auth/register", data).then((r) => r.data);

export const verifyOtp = (data) =>
  api.post("/auth/verify-otp", data).then((r) => r.data);

export const resendOtp = (data) =>
  api.post("/auth/resend-otp", data).then((r) => r.data);

export const setPassword = (data) =>
  api.post("/auth/set-password", data).then((r) => r.data);

export const login = (data) =>
  api.post("/auth/login", data).then((r) => r.data);

export const logout = () => api.post("/auth/logout").then((r) => r.data);

export const getMe = () => api.get("/auth/me").then((r) => r.data);
