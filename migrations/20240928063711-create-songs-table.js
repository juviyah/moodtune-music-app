'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('songs', {
      song_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      artist: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      album: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      duration: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      file_url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      cover_image_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('songs');
  },
};
