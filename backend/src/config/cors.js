const { createOriginValidator, getAllowedOriginsFromEnv } = require("./originPolicy");

function createCorsOptions() {
  const allowedOrigins = getAllowedOriginsFromEnv();

  return {
    credentials: true,
    origin: createOriginValidator(allowedOrigins),
  };
}

module.exports = {
  createCorsOptions,
};
