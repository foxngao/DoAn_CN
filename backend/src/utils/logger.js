const { createLogger, format, transports } = require("winston");

const DEFAULT_LEVEL_BY_ENV = {
  production: "info",
  test: "warn",
  development: "debug",
};

const resolvedLevel =
  process.env.LOG_LEVEL ||
  DEFAULT_LEVEL_BY_ENV[process.env.NODE_ENV] ||
  "info";

const redactedKeys = [
  "authorization",
  "cookie",
  "set-cookie",
  "token",
  "access_token",
  "refresh_token",
  "secret",
  "password",
  "privatekey",
  "private_key",
  "email",
  "phone",
];

function redactValue(key, value) {
  if (typeof key !== "string") {
    return value;
  }

  const lowerKey = key.toLowerCase();
  if (redactedKeys.includes(lowerKey)) {
    return "[REDACTED]";
  }

  return value;
}

function sanitizeMeta(meta) {
  if (!meta || typeof meta !== "object") {
    return meta;
  }

  if (Array.isArray(meta)) {
    return meta.map((item) => sanitizeMeta(item));
  }

  return Object.entries(meta).reduce((acc, [key, value]) => {
    if (value && typeof value === "object") {
      acc[key] = sanitizeMeta(value);
      return acc;
    }

    acc[key] = redactValue(key, value);
    return acc;
  }, {});
}

const logger = createLogger({
  level: resolvedLevel,
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const sanitizedMeta = sanitizeMeta(meta);
      const hasMeta = sanitizedMeta && Object.keys(sanitizedMeta).length > 0;
      const serializedMeta = hasMeta ? ` ${JSON.stringify(sanitizedMeta)}` : "";
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${serializedMeta}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/error.log", level: "error" })
  ],
});

module.exports = logger;
