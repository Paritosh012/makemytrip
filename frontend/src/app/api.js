import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Mandatory: without this the browser never attaches the httpOnly cookies.
  withCredentials: true,
});

/**
 * SINGLE-FLIGHT REFRESH.
 *
 * If a page fires five requests at once and the access token has just expired,
 * all five come back 401. Without this guard all five call /refresh — and
 * because refresh ROTATES, the first one revokes the token the other four are
 * holding, which trips the backend's reuse detection and logs the user out.
 *
 * So: the first 401 starts a refresh, everyone else awaits that same promise.
 */
let refreshPromise = null;

const runRefresh = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const isAuthPath = (url = "") =>
  ["/auth/login", "/auth/refresh", "/auth/register", "/auth/verify-otp"].some(
    (path) => url.includes(path),
  );

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config || {};
    const status = err.response?.status;
    const code = err.response?.data?.code;

    const canRetry =
      status === 401 &&
      code === "TOKEN_EXPIRED" &&
      !original._retry &&
      !isAuthPath(original.url);

    if (canRetry) {
      original._retry = true;

      try {
        await runRefresh();
        return api(original);
      } catch {
        // Refresh itself failed — session is genuinely dead.
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    // Existing behaviour every page depends on: flatten to a plain Error so
    // `catch (e) => setError(e.message)` keeps working.
    const message = err.response?.data?.message || "Something went wrong";
    const error = new Error(message);
    // Keep the machine-readable code reachable for callers that want it.
    error.code = code;
    error.status = status;

    return Promise.reject(error);
  },
);

export default api;
