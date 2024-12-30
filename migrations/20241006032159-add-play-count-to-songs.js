'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('songs', 'play_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0, // Initialize with 0
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('songs', 'play_count');
  }
};