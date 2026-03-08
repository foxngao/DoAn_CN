module.exports = {
  vnpay: {
    tmnCode: process.env.VNP_TmnCode,
    hashSecret: process.env.VNP_HashSecret,
    // ✅ Nếu chưa cấu hình URL VNPAY thì dùng mặc định sandbox
    url: process.env.VNP_Url || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    // ✅ returnUrl sẽ được build động trong service nếu không truyền qua biến môi trường
    returnUrl: process.env.VNP_ReturnUrl || "",
  },
  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
    // ✅ Endpoint sandbox mặc định nếu chưa cấu hình
    endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create",
    // ✅ Nếu thiếu IPN/redirect URL, sẽ được bổ sung động trong service
    ipnUrl: process.env.MOMO_IPN_URL || "",
    redirectUrl: process.env.MOMO_REDIRECT_URL || "",
  },
};