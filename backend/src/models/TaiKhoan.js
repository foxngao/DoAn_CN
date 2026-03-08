const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const { encryptPrivateKey, decryptPrivateKeyForUse } = require('../utils/crypto');

const TaiKhoan = sequelize.define('TaiKhoan', {
  maTK: {
    type: DataTypes.STRING(100),
    primaryKey: true
  },
  tenDangNhap: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  matKhau: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true
  },
  trangThai: {
    type: DataTypes.TINYINT,
    defaultValue: 1
  },
  maNhom: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  publicKey: {
    type: DataTypes.TEXT
  },
  privateKey: {
    type: DataTypes.TEXT,
    set(value) {
      this.setDataValue('privateKey', encryptPrivateKey(value));
    },
    get() {
      const storedValue = this.getDataValue('privateKey');
      return decryptPrivateKeyForUse(storedValue);
    }
  }
}, {
  tableName: 'TaiKhoan',
  timestamps: false
});

TaiKhoan.associate = (models) => {
  TaiKhoan.belongsTo(models.NhomQuyen, { foreignKey: 'maNhom' });
  TaiKhoan.hasOne(models.BacSi, { foreignKey: 'maTK' });
  TaiKhoan.hasOne(models.NhanSuYTe, { foreignKey: 'maTK' });
  TaiKhoan.hasOne(models.BenhNhan, { foreignKey: 'maTK' });
};

module.exports = TaiKhoan;
