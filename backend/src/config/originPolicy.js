const DEFAULT_LOCAL_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:4000",
  "http://localhost:5174",
  "http://localhost:5175",
];

const NON_LOCAL_ENV_NAMES = new Set(["production", "staging", "prod"]);

function normalizeOrigin(origin) {
  if (typeof origin !== "string") {
    return "";
  }

  return origin.trim();
}

function parseOriginList(rawValue) {
  if (typeof rawValue !== "string" || rawValue.trim() === "") {
    return [];
  }

  return rawValue.split(",").map(normalizeOrigin).filter(Boolean);
}

function resolveRuntimeEnvironment(originEnv = process.env) {
  const appEnv = normalizeOrigin(originEnv.APP_ENV).toLowerCase();
  const nodeEnv = normalizeOrigin(originEnv.NODE_ENV).toLowerCase();

  return appEnv || nodeEnv;
}

function shouldIncludeDefaultLocalOrigins(originEnv = process.env) {
  const runtimeEnv = resolveRuntimeEnvironment(originEnv);

  if (!runtimeEnv) {
    return true;
  }

  return !NON_LOCAL_ENV_NAMES.has(runtimeEnv);
}

function getAllowedOriginsFromEnv(originEnv = process.env) {
  const configuredOrigins = [
    ...parseOriginList(originEnv.ALLOWED_ORIGINS),
    ...parseOriginList(originEnv.FRONTEND_ORIGIN),
  ].filter((origin) => origin !== "*");

  const defaultOrigins = shouldIncludeDefaultLocalOrigins(originEnv)
    ? DEFAULT_LOCAL_ORIGINS
    : [];

  return Array.from(new Set([...configuredOrigins, ...defaultOrigins]));
}

function createOriginValidator(allowedOrigins = getAllowedOriginsFromEnv()) {
  return (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin is not allowed by CORS"), false);
  };
}

function createSocketCorsOptions(allowedOrigins = getAllowedOriginsFromEnv()) {
  return {
    origin: createOriginValidator(allowedOrigins),
    methods: ["GET", "POST"],
    credentials: true,
  };
}

module.exports = {
  DEFAULT_LOCAL_ORIGINS,
  NON_LOCAL_ENV_NAMES,
  resolveRuntimeEnvironment,
  shouldIncludeDefaultLocalOrigins,
  getAllowedOriginsFromEnv,
  createOriginValidator,
  createSocketCorsOptions,
};
