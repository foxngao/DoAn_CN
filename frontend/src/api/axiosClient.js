import axios from "axios";

export const SESSION_EXPIRED_EVENT = "auth:session-expired";

export const emitSessionExpired = (payload = {}) => {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: payload }));
};

export const CART_NOT_FOUND_CODE = "CART_NOT_FOUND";

export const isCartNotFoundRequest = (url = "") =>
  typeof url === "string" && url.includes("/hoadon/giohang/");

const axiosClient = axios.create({
  baseURL: "/api", // 🔥 Kích hoạt proxy trong vite.config.js
  withCredentials: true,
});

const getCsrfTokenFromCookie = () => {
  const match = document.cookie
    .split(";")
    .map((segment) => segment.trim())
    .find((segment) => segment.startsWith("csrf_token="));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.split("=").slice(1).join("="));
};

axiosClient.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();
  const isStateChangingRequest = ["post", "put", "patch", "delete"].includes(method);

  if (isStateChangingRequest) {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken) {
      config.headers["x-csrf-token"] = csrfToken;
    }
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      emitSessionExpired({ status, url: error.config?.url });
    }

    // Keep 404 semantics for cart endpoint, but expose explicit typed contract.
    if (status === 404 && isCartNotFoundRequest(error.config?.url)) {
      error.code = CART_NOT_FOUND_CODE;
      error.isCartNotFound = true;
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
