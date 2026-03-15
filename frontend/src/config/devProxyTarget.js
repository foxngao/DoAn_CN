export const DEFAULT_DEV_PROXY_TARGET = "http://localhost:4000";

export const resolveDevProxyTarget = (env = process.env) => {
  const candidate = env?.VITE_DEV_PROXY_TARGET;
  return candidate && candidate.trim() ? candidate.trim() : DEFAULT_DEV_PROXY_TARGET;
};
