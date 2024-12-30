module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('songs', 'tags', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('songs', 'tags');
  }
};