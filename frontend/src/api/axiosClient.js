import axios from "axios";

export const SESSION_EXPIRED_EVENT = "auth:session-expired";

export const emitSessionExpired = (payload = {}) => {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: payload }));
};

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

    // Suppress 404 errors cho endpoint giỏ hàng (giỏ hàng có thể không tồn tại sau khi đã tạo hóa đơn)
    if (status === 404 && error.config?.url?.includes('/hoadon/giohang/')) {
      // Trả về một response giả với data rỗng thay vì throw error
      return Promise.resolve({
        data: {
          message: "Không tìm thấy giỏ hàng",
          data: { gioHang: null, chiTiet: [] }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config
      });
    }
    // Các lỗi khác vẫn được xử lý bình thường
    return Promise.reject(error);
  }
);

export default axiosClient;
