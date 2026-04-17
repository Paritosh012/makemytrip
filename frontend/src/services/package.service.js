import api from "../app/api";

// HOST (private)
export const createPackage = (data) =>
  api.post("/packages", data).then((res) => res.data);

export const getPackages = (params) =>
  api.get("/packages", { params }).then((res) => res.data);

export const getPackage = (id) =>
  api.get(`/packages/${id}`).then((res) => res.data);

export const updatePackage = (id, data) =>
  api.patch(`/packages/${id}`, data).then((res) => res.data);

export const deletePackage = (id) =>
  api.delete(`/packages/${id}`).then((res) => res.data);
 
// USER (public)
export const getPublicPackages = () =>
  api.get("/packages/public").then((res) => res.data);
