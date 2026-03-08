const crypto = require('crypto');
const db = require('../models'); 
const CryptoJS = require('crypto-js');
const {
  resolvePrivateKey,
  encryptPrivateKey,
} = require('../utils/crypto');

function requireEnv(name) {
  const value = process.env[name];
  if (!value || String(value).trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(value).trim();
}

const DATA_ENCRYPTION_KEY = requireEnv("DATA_ENCRYPTION_KEY");
const HASH_PEPPER = requireEnv("HASH_PEPPER");

/**
 * Mã hóa dữ liệu (string) bằng AES
 * @param {string} data - Dữ liệu JSON đã stringify
 * @returns {string} - Dữ liệu đã mã hóa
 */
function encryptData(data) {
    return CryptoJS.AES.encrypt(data, DATA_ENCRYPTION_KEY).toString();
}

/**
 * Giải mã dữ liệu (string)
 * @param {string} encryptedData - Dữ liệu đã mã hóa
 * @returns {string} - Dữ liệu JSON đã giải mã
 */
function decryptData(encryptedData) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, DATA_ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}
// --- KẾT THÚC CHỨC NĂNG MÃ HÓA/GIẢI MÃ ---
/**
 * Hàm tạo hash (Sửa: Dùng HMAC và thêm trường mới)
 * @param {string} timestampString - Dấu thời gian (ISO STRING)
 * @param {string} data_json - Dữ liệu đã JSON.stringify()
 * @param {string} previousHash - Hash của khối trước
 * @param {string} signature - Chữ ký của khối này
 * @param {string} maNguoiTao - Mã TK của người ký
 * @returns {string} - Hash HMAC-SHA-256
 */
function createHash(timestampString, data_json, previousHash, signature, maNguoiTao) {
  const dataString = `${timestampString}${data_json}${previousHash}${signature}${maNguoiTao}`;
  
  return crypto.createHmac('sha256', HASH_PEPPER)
               .update(dataString)
               .digest('hex');
}

/**
 * Hàm lấy khối (block) cuối cùng (Giữ nguyên)
 */
async function getLatestBlock(maHSBA) {
  try {
    const latestBlock = await db.HoSoAnChuoiKham.findOne({
      where: { maHSBA },
      order: [['timestamp', 'DESC']],
    });
    return latestBlock;
  } catch (error) {
    console.error("Lỗi khi lấy khối cuối cùng:", error);
    return null;
  }
}

/**
 * Hàm thêm một khối (block) mới (Sửa: Thêm logic ký)
 * @param {string} maHSBA - Mã hồ sơ
 * @param {string} blockType - Loại khối (PHIEU_KHAM, DON_THUOC...)
 * @param {object} data - Dữ liệu (chưa stringify)
 * @param {string} maTK_NguoiTao - maTK của người thực hiện (để ký)
 */
async function addBlock(maHSBA, blockType, data, maTK_NguoiTao) {
  try {
    console.log("🔗 [blockchain.addBlock] Bắt đầu tạo block:", {
      maHSBA,
      blockType,
      maTK_NguoiTao,
      dataKeys: Object.keys(data)
    });

    // 1. Lấy Private Key của người tạo
    const user = await db.TaiKhoan.findByPk(maTK_NguoiTao, { attributes: ['privateKey'] });
    if (!user || !user.privateKey) {
      console.error("❌ [blockchain.addBlock] Không tìm thấy Private Key:", maTK_NguoiTao);
      throw new Error(`Bảo mật: Không tìm thấy Private Key cho người dùng ${maTK_NguoiTao}.`);
    }
    const storedPrivateKey = user.getDataValue('privateKey');
    const privateKey = resolvePrivateKeyForSigning(storedPrivateKey);

    if (storedPrivateKey && storedPrivateKey === privateKey) {
      await db.TaiKhoan.update(
        { privateKey: encryptPrivateKey(storedPrivateKey) },
        { where: { maTK: maTK_NguoiTao } }
      );
    }
    console.log("✅ [blockchain.addBlock] Đã lấy Private Key");

    // 2. Lấy hash khối trước
    const latestBlock = await getLatestBlock(maHSBA);
    const previousHash = latestBlock ? latestBlock.current_hash : "0";
    
    // 3. Chuẩn bị dữ liệu
    let timestamp = new Date();
    timestamp.setMilliseconds(0); 
    const timestampString = timestamp.toISOString();
    const data_json_string_original = JSON.stringify(data);
    
    // 4. TẠO CHỮ KÝ
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(data_json_string_original); // Ký trên dữ liệu
    signer.end();
    const signature = signer.sign(privateKey, 'hex');

    // 5. TẠO HASH MỚI
    // Hash mới bây giờ bao gồm cả chữ ký
    const currentHash = createHash(
      timestampString, 
      data_json_string_original,
      previousHash, 
      signature, 
      maTK_NguoiTao
    );

    // 6. MÃ HÓA DỮ LIỆU TRƯỚC KHI LƯU
    const encrypted_data_json = encryptData(data_json_string_original);

    // 7. LƯU KHỐI MỚI
    console.log("💾 [blockchain.addBlock] Đang lưu block vào database...");
    try {
      const newBlock = await db.HoSoAnChuoiKham.create({
        maHSBA: maHSBA,
        timestamp: timestamp,
        block_type: blockType,
        data_json: encrypted_data_json,
        maNguoiTao: maTK_NguoiTao, // Cột mới
        signature: signature,      // Cột mới
        previous_hash: previousHash,
        current_hash: currentHash,
      });

      console.log(`✅ [blockchain.addBlock] Đã KÝ và THÊM khối [${blockType}] cho HSBA ${maHSBA}`, {
        blockId: newBlock.id,
        maHSBA,
        blockType,
        timestamp: newBlock.timestamp
      });
      return newBlock;
    } catch (dbError) {
      console.error("❌ [blockchain.addBlock] Lỗi khi lưu vào database:", {
        error: dbError.message,
        stack: dbError.stack,
        maHSBA,
        blockType
      });
      throw dbError;
    }

  } catch (error) {
    console.error("❌ [blockchain.addBlock] Lỗi khi thêm khối:", {
      error: error.message,
      stack: error.stack,
      maHSBA,
      blockType,
      maTK_NguoiTao
    });
    throw error; // Giữ nguyên error gốc để controller có thể xử lý
  }
}
/**
 * Hàm giải mã dữ liệu của tất cả các khối trong chuỗi (Dùng khi ĐỌC)
 * @param {Array<object>} blocks - Danh sách khối từ DB (chứa data_json đã mã hóa)
 * @returns {Array<object>} - Danh sách khối với data_json đã giải mã
 */
function decryptBlocks(blocks) {
    return blocks.map(block => {
        try {
            // Kiểm tra xem data_json có phải là string không
            if (typeof block.data_json === 'string' && block.data_json.startsWith('U2FsdGVk')) { 
                const decryptedJson = decryptData(block.data_json);
                return {
                    ...block,
                    data_json_original: block.data_json, // Giữ bản mã hóa
                    data_json: decryptedJson,             // Thay bằng bản giải mã
                };
            }
            // Nếu không phải chuỗi mã hóa, trả về nguyên bản
            return block; 
        } catch (e) {
            console.error(`❌ Lỗi giải mã khối ${block.id}: ${e.message}`);
            return {
                ...block,
                data_json_original: block.data_json,
                data_json: JSON.stringify({ error: "Lỗi giải mã dữ liệu" }),
            };
        }
    });
}

module.exports = {
  addBlock,
  getLatestBlock,
  createHash,
  decryptBlocks,
  encryptData,
  decryptData,
  resolvePrivateKeyForSigning
};

function resolvePrivateKeyForSigning(storedPrivateKey) {
  return resolvePrivateKey(storedPrivateKey).plainPrivateKey;
}
