const jwt = require("jsonwebtoken");

function parseCookiesFromHeader(cookieHeader) {
  if (typeof cookieHeader !== "string" || cookieHeader.trim() === "") {
    return {};
  }

  return cookieHeader.split(";").reduce((acc, segment) => {
    const [rawKey, ...rest] = segment.trim().split("=");
    if (!rawKey) {
      return acc;
    }

    const rawValue = rest.join("=");
    acc[rawKey] = decodeURIComponent(rawValue || "");
    return acc;
  }, {});
}

function extractSocketTokenFromHandshake(handshake = {}) {
  const authHeader = handshake.auth?.token;
  if (typeof authHeader === "string" && authHeader.trim() !== "") {
    const trimmedHeader = authHeader.trim();
    const parts = trimmedHeader.split(" ");
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      return parts[1];
    }

    return trimmedHeader;
  }

  const cookieHeader = handshake.headers?.cookie;
  const cookies = parseCookiesFromHeader(cookieHeader);
  return cookies.session_token || null;
}

function createSocketAuthMiddleware({ secretKey, logger } = {}) {
  return (socket, next) => {
    const token = extractSocketTokenFromHandshake(socket.handshake);

    if (!token) {
      return next(new Error("Xác thực thất bại: Không có session token"));
    }

    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        logger?.warn?.("Xác thực Socket thất bại", { errorMessage: err.message });
        return next(new Error("Xác thực thất bại: Token không hợp lệ"));
      }

      socket.user = decoded;
      next();
    });
  };
}

module.exports = {
  parseCookiesFromHeader,
  extractSocketTokenFromHandshake,
  createSocketAuthMiddleware,
};
