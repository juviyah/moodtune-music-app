const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SongPlaylist = sequelize.define('SongPlaylist', {
    song_id: {
        type: DataTypes.INTEGER,
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
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
            model: 'playlists', // Reference to 'moods' table
            key: 'playlist_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    }
}, {
    tableName: 'song_playlists',
    timestamps: false
});

module.exports = SongPlaylist;