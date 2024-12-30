'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('playlists', 'official_playlist', {
      type: Sequelize.BOOLEAN, 
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('playlists', 'official_playlist');
  }
};