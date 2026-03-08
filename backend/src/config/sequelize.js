const { Sequelize } = require("sequelize");

const DEFAULT_DB_TIMEZONE = "+07:00";
const rawDbTimezone = process.env.DB_TIMEZONE || DEFAULT_DB_TIMEZONE;
const dbTimezone = /^[+-]\d{2}:\d{2}$/.test(rawDbTimezone)
  ? rawDbTimezone
  : DEFAULT_DB_TIMEZONE;

const sequelize = new Sequelize(
  process.env.DB_NAME || "hospital",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
    timezone: dbTimezone,
    dialectOptions: {
      timezone: dbTimezone,
    },
  }
);

module.exports = sequelize;
