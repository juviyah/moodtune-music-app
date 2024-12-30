const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Playlist = sequelize.define('Playlist', {
    playlist_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    playlist_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    playlist_type: {
        type: DataTypes.ENUM('mood', 'activity'),
        allowNull: false
    },
    playlist_icon: {
        type: DataTypes.STRING,
        allowNull: true
    },
    official_playlist: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    created_by: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'playlists',
    timestamps: false
});

module.exports = Playlist;