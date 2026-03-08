function ok(
  res,
  { message = "Success", data = null, status = 200, pagination = null, meta = null } = {}
) {
  const payload = {
    success: true,
    message,
    data,
    errors: null,
  };

  if (pagination) payload.pagination = pagination;
  if (meta) payload.meta = meta;

  return res.status(status).json(payload);
}

function fail(res, { message = "Error", errors = null, status = 500 } = {}) {
  return res.status(status).json({
    success: false,
    message,
    data: null,
    errors,
  });
}

module.exports = {
  ok,
  fail,
};
