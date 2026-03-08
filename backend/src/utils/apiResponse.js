function ok(res, { message = "Success", data = null, status = 200 } = {}) {
  return res.status(status).json({
    success: true,
    message,
    data,
    errors: null,
  });
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
