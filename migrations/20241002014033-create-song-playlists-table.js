'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('song_playlists', {
      song_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'songs', // Reference to 'songs' table
          key: 'song_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      playlist_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'playlists', // Reference to 'moods' table
          key: 'playlist_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('song_playlists');
  },
};
