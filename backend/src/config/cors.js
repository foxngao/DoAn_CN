const DEFAULT_LOCAL_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4000",
  "http://localhost:5174",
  "http://localhost:5175",
];

function normalizeOrigin(origin) {
  if (typeof origin !== "string") {
    return "";
  }

  return origin.trim();
}

function getAllowedOriginsFromEnv() {
  const sources = [process.env.ALLOWED_ORIGINS, process.env.FRONTEND_ORIGIN]
    .filter((value) => typeof value === "string" && value.trim() !== "")
    .flatMap((value) => value.split(","));

  const origins = sources
    .map(normalizeOrigin)
    .filter((origin) => origin && origin !== "*");

  if (origins.length === 0) {
    return DEFAULT_LOCAL_ORIGINS;
  }

  return Array.from(new Set(origins));
}

function createCorsOptions() {
  const allowedOrigins = getAllowedOriginsFromEnv();

  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS"), false);
    },
  };
}

module.exports = {
  createCorsOptions,
};
