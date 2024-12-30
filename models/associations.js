const User = require('./user');
const Song = require('./song');
const Playlist = require('./playlist');
const SongPlaylist = require('./songPlaylist');
const PlayHistory = require('./playHistory');

// Define the many-to-many association
Song.belongsToMany(Playlist, { 
    through: SongPlaylist,
    foreignKey: 'song_id', 
    otherKey: 'playlist_id',
    onDelete: 'CASCADE' 
});

Playlist.belongsToMany(Song, { 
    through: SongPlaylist, 
    foreignKey: 'playlist_id', 
    otherKey: 'song_id',
    onDelete: 'CASCADE'
});

User.hasMany(PlayHistory, { foreignKey: 'username' });
PlayHistory.belongsTo(User, { foreignKey: 'username' });
Song.hasMany(PlayHistory, { foreignKey: 'song_id' });
PlayHistory.belongsTo(Song, { foreignKey: 'song_id' });
PlayHistory.belongsTo(Playlist, { foreignKey: 'playlist_id' });

module.exports = { Song, Playlist, SongPlaylist, PlayHistory, User };