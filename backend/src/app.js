const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");
const { randomUUID } = require("crypto");
const dotenv = require("dotenv");
const errorHandler = require("./utils/errorHandler");
const logger = require("./utils/logger");
const { createCorsOptions } = require("./config/cors");

// Tải biến môi trường từ file .env
dotenv.config();

app.use(cors(createCorsOptions()));

app.use((req, res, next) => {
  const incomingRequestId = req.headers["x-request-id"];
  const requestId =
    typeof incomingRequestId === "string" && incomingRequestId.trim() !== ""
      ? incomingRequestId.trim()
      : randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
});

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    logger.info("HTTP request completed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
});

app.use((req, _res, next) => {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    req.cookies = {};
    next();
    return;
  }

  req.cookies = cookieHeader.split(";").reduce((acc, segment) => {
    const [rawKey, ...rest] = segment.trim().split("=");
    if (!rawKey) {
      return acc;
    }

    const rawValue = rest.join("=");
    acc[rawKey] = decodeURIComponent(rawValue || "");
    return acc;
  }, {});

  next();
});

app.use((req, res, next) => {
  const isSafeMethod = ["GET", "HEAD", "OPTIONS"].includes(req.method);
  if (isSafeMethod) {
    next();
    return;
  }

  const hasSessionCookie = Boolean(req.cookies?.session_token);
  if (!hasSessionCookie) {
    next();
    return;
  }

  const pathWithoutQuery = req.originalUrl.split("?")[0];
  const csrfExemptPaths = new Set([
    "/api/auth/login",
    "/api/auth/google-login",
    "/api/auth/register",
    "/api/auth/request-otp",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
  ]);

  if (csrfExemptPaths.has(pathWithoutQuery)) {
    next();
    return;
  }

  const csrfFromCookie = req.cookies?.csrf_token;
  const csrfFromHeader = req.headers["x-csrf-token"];
  if (!csrfFromCookie || !csrfFromHeader || csrfFromCookie !== csrfFromHeader) {
    res.status(403).json({ message: "CSRF token không hợp lệ" });
    return;
  }

  next();
});


// SỬA LỖI 413: Tăng giới hạn kích thước payload (Base64 files)
// Cấu hình cho phép nhận dữ liệu JSON và form-urlencoded với giới hạn 50MB
app.use(express.json({ limit: '100mb' })); // Tăng giới hạn JSON
app.use(express.urlencoded({ extended: true, limit: '100mb' })); // Tăng giới hạn URL-encoded
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: Number(process.uptime().toFixed(2)),
  });
});

// Import tất cả route từ các module (gom lại)
const tatCaTuyen = require("./routes");
app.use("/api", tatCaTuyen); // Tất cả các API sẽ đi qua /api

// Middleware xử lý lỗi chung toàn hệ thống
app.use(errorHandler);

// Xuất ứng dụng để file server.js dùng
module.exports = app;
