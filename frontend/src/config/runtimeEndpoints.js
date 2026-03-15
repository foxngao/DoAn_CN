const LOCAL_BACKEND_ORIGIN = "http://localhost:4000";

const trimTrailingSlash = (url = "") => url.replace(/\/+$/, "");

const isLocalHost = (hostname = "") => {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1";
};

const getProjectSlugFromHostname = (hostname = "") => {
  const match = hostname.match(/^([^.]+)\.duongminhtien\.io\.vn$/i);
  return match ? match[1] : null;
};

const inferApiOriginFromLocation = (locationObj) => {
  if (!locationObj) {
    return LOCAL_BACKEND_ORIGIN;
  }

  const protocol = locationObj.protocol || "http:";
  const hostname = locationObj.hostname || "localhost";

  if (isLocalHost(hostname)) {
    return LOCAL_BACKEND_ORIGIN;
  }

  const projectSlug = getProjectSlugFromHostname(hostname);
  if (projectSlug) {
    return `${protocol}//api.${projectSlug}.duongminhtien.io.vn`;
  }

  return `${protocol}//${hostname}`;
};

const getBrowserLocation = () => (typeof window !== "undefined" ? window.location : undefined);

const getEnvOverride = (env, key) => trimTrailingSlash(env?.[key] || "");

export const getApiOrigin = ({
  env = import.meta.env,
  locationObj = getBrowserLocation(),
} = {}) => {
  const override = getEnvOverride(env, "VITE_API_ORIGIN");
  if (override) {
    return override;
  }

  return trimTrailingSlash(inferApiOriginFromLocation(locationObj));
};

export const getUploadOrigin = ({
  env = import.meta.env,
  locationObj = getBrowserLocation(),
} = {}) => {
  const override = getEnvOverride(env, "VITE_UPLOAD_ORIGIN");
  if (override) {
    return override;
  }

  return getApiOrigin({ env, locationObj });
};

export const getSocketOrigin = ({
  env = import.meta.env,
  locationObj = getBrowserLocation(),
} = {}) => {
  const override = getEnvOverride(env, "VITE_SOCKET_URL");
  if (override) {
    return override;
  }

  return getApiOrigin({ env, locationObj });
};

export const buildUploadUrl = (dataUrl, options = {}) => {
  if (!dataUrl) {
    return dataUrl;
  }

  if (/^https?:\/\//i.test(dataUrl) || dataUrl.startsWith("data:")) {
    return dataUrl;
  }

  if (dataUrl.startsWith("/uploads/")) {
    return `${getUploadOrigin(options)}${dataUrl}`;
  }

  return dataUrl;
};

export const __internal = {
  LOCAL_BACKEND_ORIGIN,
  getProjectSlugFromHostname,
  inferApiOriginFromLocation,
};
