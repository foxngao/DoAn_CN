const crypto = require("crypto");
const qs = require("qs");
const moment = require("moment");
const config = require("../config/payment.config");

/**
 * Hàm sắp xếp object theo key A-Z (Bắt buộc của VNPAY)
 */
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

const PaymentService = {
  /**
   * Tạo URL thanh toán VNPAY
   */
  createVnPayUrl: (req, { amount, orderId, orderInfo, bankCode }) => {
    process.env.TZ = "Asia/Ho_Chi_Minh";
    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");

    // Xử lý IP Address (VNPAY không chấp nhận IPv6 ::1)
    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    if (ipAddr === '::1') {
        ipAddr = '127.0.0.1';
    }

    const tmnCode = config.vnpay.tmnCode;
    const secretKey = config.vnpay.hashSecret;
    let vnpUrl = config.vnpay.url;
    const returnUrl = config.vnpay.returnUrl;

    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = tmnCode;
    vnp_Params["vnp_Locale"] = "vn";
    vnp_Params["vnp_CurrCode"] = "VND";
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = orderInfo;
    vnp_Params["vnp_OrderType"] = "other"; // Đổi thành 'other' cho an toàn
    vnp_Params["vnp_Amount"] = Math.floor(amount * 100); // Nhân 100, ép kiểu số nguyên
    vnp_Params["vnp_ReturnUrl"] = returnUrl;
    vnp_Params["vnp_IpAddr"] = ipAddr;
    vnp_Params["vnp_CreateDate"] = createDate;

    if (bankCode) {
      vnp_Params["vnp_BankCode"] = bankCode;
    }

    // BƯỚC QUAN TRỌNG: Sắp xếp tham số
    vnp_Params = sortObject(vnp_Params);

    // Tạo chữ ký bảo mật
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(new Buffer.from(signData, "utf-8")).digest("hex");
    
    vnp_Params["vnp_SecureHash"] = signed;
    
    vnpUrl += "?" + qs.stringify(vnp_Params, { encode: false });

    console.log("🔗 VNPAY URL Created:", vnpUrl); 
    return vnpUrl;
  },

  /**
   * Xác thực chữ ký VNPAY
   */
  verifyVnPaySignature: (vnp_Params) => {
    let secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    const secretKey = config.vnpay.hashSecret;
    const signData = qs.stringify(vnp_Params, { encode: false });
    
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(new Buffer.from(signData, "utf-8")).digest("hex");

    console.log("🔍 VNPAY Verify:");
    console.log("- Client sent:", secureHash);
    console.log("- Server calc:", signed);

    return {
      isSuccess: secureHash === signed,
      responseCode: vnp_Params["vnp_ResponseCode"],
      orderId: vnp_Params["vnp_TxnRef"],
      amount: vnp_Params["vnp_Amount"] / 100,
      transactionNo: vnp_Params["vnp_TransactionNo"]
    };
  },

  /**
   * Tạo Request MoMo
   */
  createMoMoRequest: ({ requestId, orderId, amount, orderInfo }) => {
    const { partnerCode, accessKey, secretKey, ipnUrl, redirectUrl } = config.momo;
    const requestType = "captureWallet";
    const extraData = "";

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    console.log("📝 MoMo Raw Signature:", rawSignature); // Debug

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    return {
      partnerCode,
      partnerName: "Hospital Management",
      storeId: "MomoTestStore",
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: "vi",
      requestType,
      autoCapture: true,
      extraData,
      signature,
    };
  },

  /**
   * Xác thực chữ ký MoMo IPN
   */
  verifyMoMoSignature: (body) => {
    const {
      partnerCode, orderId, requestId, amount, orderInfo,
      orderType, transId, resultCode, message, payType,
      responseTime, extraData, signature,
    } = body;

    const { accessKey, secretKey } = config.momo;

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const generatedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    return {
      isSuccess: signature === generatedSignature,
      resultCode: resultCode,
      orderId: orderId,
      amount: amount,
      transId: transId
    };
  }
};

module.exports = PaymentService;