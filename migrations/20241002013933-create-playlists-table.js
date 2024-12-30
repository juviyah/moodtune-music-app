'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('playlists', {
      playlist_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      playlist_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      playlist_type: {
        type: Sequelize.ENUM('mood', 'activity'),
        allowNull: false,
      },
      playlist_icon: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('playlists');
  },
};
