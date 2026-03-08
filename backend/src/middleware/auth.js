const jwt = require("jsonwebtoken");
const env = require("../config/env");

const SECRET_KEY = env.JWT_SECRET;

//  Middleware kiểm tra token đăng nhập
module.exports = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const headerToken = authHeader ? authHeader.split(" ")[1] : null;
  const cookieToken = req.cookies?.session_token;
  const candidateTokens = [headerToken, cookieToken].filter(Boolean);

  if (candidateTokens.length === 0) {
    console.error("Không có token trong header yêu cầu");
    return res.status(401).json({ thongBao: "Không có token truy cập" });
  }

  for (const token of candidateTokens) {
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      console.log("✅ Token đã xác thực:", decoded);
      req.user = decoded;
      next();
      return;
    } catch (_error) {
      continue;
    }
  }

  console.error("Lỗi xác thực token: tất cả token đều không hợp lệ");
  return res.status(403).json({ thongBao: "Token không hợp lệ hoặc đã hết hạn" });
};
