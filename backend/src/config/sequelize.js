const { Sequelize } = require("sequelize");
const env = require("./env");

const DEFAULT_DB_TIMEZONE = "+07:00";
const rawDbTimezone = env.DB_TIMEZONE || DEFAULT_DB_TIMEZONE;
const dbTimezone = /^[+-]\d{2}:\d{2}$/.test(rawDbTimezone)
  ? rawDbTimezone
  : DEFAULT_DB_TIMEZONE;

const sequelize = new Sequelize(
  env.DB_NAME || "hospital",
  env.DB_USER || "root",
  env.DB_PASSWORD || "",
  {
    host: env.DB_HOST || "localhost",
    port: env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
    timezone: dbTimezone,
    pool: {
      max: env.DB_POOL_MAX,
      min: env.DB_POOL_MIN,
      acquire: env.DB_POOL_ACQUIRE_MS,
      idle: env.DB_POOL_IDLE_MS,
      evict: env.DB_POOL_EVICT_MS,
    },
    retry: {
      max: env.DB_RETRY_MAX,
      backoffBase: env.DB_RETRY_BACKOFF_MS,
      backoffExponent: env.DB_RETRY_BACKOFF_EXPONENT,
      match: [/Deadlock/i, /ETIMEDOUT/i, /ECONNRESET/i, /SequelizeConnectionError/i],
    },
    dialectOptions: {
      timezone: dbTimezone,
    },
  }
);

module.exports = sequelize;
