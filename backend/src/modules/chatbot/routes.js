const express = require('express');
const router = express.Router();
const controller = require('./chatbot.controller');
const verifyToken = require('../../middleware/auth'); // Import middleware xác thực
const jwt = require('jsonwebtoken');
const env = require('../../config/env');

const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const headerToken = authHeader ? authHeader.replace('Bearer ', '') : null;
  const cookieToken = req.cookies?.session_token;
  const candidateTokens = [headerToken, cookieToken].filter(Boolean);

  req.user = null;

  for (const token of candidateTokens) {
    try {
      req.user = jwt.verify(token, env.JWT_SECRET);
      break;
    } catch (_error) {
      continue;
    }
  }

  next();
};

/**
 * @route   POST /api/chatbot
 * @desc    Gửi tin nhắn đến chatbot
 * @access  Public (optional auth)
 */
router.post('/',optionalAuth, controller.handleMessage);

/**
 * @route   POST /api/chatbot/upload
 * @desc    Gửi ảnh đến chatbot
 * @access  Private
 */
router.post('/upload', verifyToken, controller.handleImageMessage);

/**
 * @route   GET /api/chatbot/history
 * @desc    Lấy lịch sử hội thoại của người dùng
 * @access  Private
 */
router.get('/history', verifyToken, controller.getHistory);

/**
 * @route   GET /api/chatbot/intents
 * @desc    Lấy danh sách các intent (demo)
 * @access  Private (hoặc Admin)
 */
router.get('/intents', verifyToken, controller.getIntents);

module.exports = router;
