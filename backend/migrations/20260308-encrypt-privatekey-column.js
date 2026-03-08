const { encryptPrivateKey, isEncryptedPrivateKey } = require("../src/utils/crypto");

module.exports = {
  async up(queryInterface) {
    if (!process.env.PRIVATE_KEY_ENCRYPTION_KEY) {
      console.warn("[migration] Skip privateKey encryption: missing PRIVATE_KEY_ENCRYPTION_KEY");
      return;
    }

    const [rows] = await queryInterface.sequelize.query(
      "SELECT maTK, privateKey FROM TaiKhoan WHERE privateKey IS NOT NULL"
    );

    for (const row of rows) {
      if (!row.privateKey || isEncryptedPrivateKey(row.privateKey)) {
        continue;
      }

      const encryptedPrivateKey = encryptPrivateKey(row.privateKey);

      await queryInterface.sequelize.query(
        "UPDATE TaiKhoan SET privateKey = :privateKey WHERE maTK = :maTK",
        {
          replacements: {
            privateKey: encryptedPrivateKey,
            maTK: row.maTK,
          },
        }
      );
    }
  },

  async down() {
    console.warn("[migration] down is noop to avoid decrypting sensitive keys");
  },
};
