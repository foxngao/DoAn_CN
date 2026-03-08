const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const { HOA_DON_STATUS, HOA_DON_STATUS_VALUES } = require('../constants/status');

const HoaDon = sequelize.define('HoaDon', {
  maHD: {
    type: DataTypes.STRING(100),
    primaryKey: true
  },
  maBN: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  ngayLap: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  tongTien: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  trangThai: {
    type: DataTypes.ENUM(...HOA_DON_STATUS_VALUES),
    defaultValue: HOA_DON_STATUS.CHUA_THANH_TOAN,
    validate: {
      isIn: [HOA_DON_STATUS_VALUES],
    }
  },
  maNS: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'HoaDon',
  timestamps: false
});

HoaDon.associate = (models) => {
  HoaDon.belongsTo(models.BenhNhan, { foreignKey: 'maBN' });
  HoaDon.belongsTo(models.NhanSuYTe, { foreignKey: 'maNS' });
};

module.exports = HoaDon;
