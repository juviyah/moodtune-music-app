'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('play_histories', {
      fields: ['song_id'],
      type: 'foreign key',
      name: 'fk_song_id',
      references: {
        table: 'songs',
        field: 'song_id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('play_histories', {
      fields: ['playlist_id'],
      type: 'foreign key',
      name: 'fk_playlist_id',
      references: {
        table: 'playlists',
        field: 'playlist_id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    await queryInterface.addConstraint('play_histories', {
      fields: ['username'],
      type: 'foreign key',
      name: 'fk_username',
      references: {
        table: 'users',
        field: 'username'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('play_histories', 'fk_song_id');
    await queryInterface.removeConstraint('play_histories', 'fk_playlist_id');
    await queryInterface.removeConstraint('play_histories', 'fk_username');
  }
};
