module.exports = {
  async up(queryInterface) {
    console.info("[migration] baseline marker only: no schema/data change");
    await queryInterface.sequelize.query(
      "SELECT 1"
    );
  },

  async down(queryInterface) {
    console.info("[migration] undo baseline marker only: no schema/data change");
    await queryInterface.sequelize.query(
      "SELECT 1"
    );
  },
};
