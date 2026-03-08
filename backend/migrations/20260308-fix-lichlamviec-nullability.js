module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = "LichLamViec";
    const table = await queryInterface.describeTable(tableName);

    if (table.maBS && table.maBS.allowNull === false) {
      await queryInterface.changeColumn(tableName, "maBS", {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    if (table.maNS && table.maNS.allowNull === false) {
      await queryInterface.changeColumn(tableName, "maNS", {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("SELECT 1");
  },
};
