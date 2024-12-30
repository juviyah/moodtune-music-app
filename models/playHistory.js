// playHistory.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlayHistory = sequelize.define('PlayHistory', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    song_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'songs',
            key: 'song_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    playlist_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'playlists',
            key: 'playlist_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: 'username'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    played_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'play_histories',
    timestamps: false
});

module.exports = PlayHistory;
