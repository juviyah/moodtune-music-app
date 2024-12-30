const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Song = sequelize.define('Song', {
    song_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    artist: {
        type: DataTypes.STRING,
        allowNull: true
    },
    album: {
        type: DataTypes.STRING,
        allowNull: true
    },
    duration: {
        type: DataTypes.TIME,
        allowNull: true
    },
    file_url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cover_image_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    play_count: {
        type:DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
    },
    created_by: { 
        type: DataTypes.STRING, 
        allowNull: true,
    },
    tags: {
        type: DataTypes.STRING,  
        allowNull: true
    }
}, {
    tableName: 'songs',
    timestamps: false
});

module.exports = Song;
