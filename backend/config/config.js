require("dotenv").config();

const config = {
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "hospital",
  host: process.env.DB_HOST || "127.0.0.1",
  dialect: "mysql",
  logging: false,
};

module.exports = {
  development: config,
  test: config,
  production: config,
};
