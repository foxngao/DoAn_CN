const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const requiredVars = ["JWT_SECRET", "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];

const missingVars = requiredVars.filter((name) => {
  const value = process.env[name];
  return typeof value !== "string" || value.trim() === "";
});

function parsePositiveIntEnv(name, defaultValue) {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return defaultValue;
  }

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name}: expected a positive integer, received '${rawValue}'`);
  }

  return parsed;
}

function parseNonNegativeIntEnv(name, defaultValue) {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return defaultValue;
  }

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid ${name}: expected a non-negative integer, received '${rawValue}'`);
  }

  return parsed;
}

function parsePositiveNumberEnv(name, defaultValue) {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return defaultValue;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name}: expected a positive number, received '${rawValue}'`);
  }

  return parsed;
}

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(", ")}. Please set them in backend/.env or process environment.`
  );
}

const env = {
  JWT_SECRET: process.env.JWT_SECRET,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,
  DB_TIMEZONE: process.env.DB_TIMEZONE || "+07:00",
  DB_POOL_MAX: parsePositiveIntEnv("DB_POOL_MAX", 10),
  DB_POOL_MIN: parseNonNegativeIntEnv("DB_POOL_MIN", 0),
  DB_POOL_ACQUIRE_MS: parsePositiveIntEnv("DB_POOL_ACQUIRE_MS", 30000),
  DB_POOL_IDLE_MS: parsePositiveIntEnv("DB_POOL_IDLE_MS", 10000),
  DB_POOL_EVICT_MS: parsePositiveIntEnv("DB_POOL_EVICT_MS", 1000),
  DB_RETRY_MAX: parseNonNegativeIntEnv("DB_RETRY_MAX", 3),
  DB_RETRY_BACKOFF_MS: parsePositiveIntEnv("DB_RETRY_BACKOFF_MS", 100),
  DB_RETRY_BACKOFF_EXPONENT: parsePositiveNumberEnv("DB_RETRY_BACKOFF_EXPONENT", 1.5),
  SOCKET_SLOW_THRESHOLD_MS: parsePositiveIntEnv("SOCKET_SLOW_THRESHOLD_MS", 300),
};

module.exports = env;
