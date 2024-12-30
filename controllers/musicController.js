const { Sequelize } = require('sequelize');
const { Op } = require('sequelize');
const Song = require('../models/song');
const Playlist = require('../models/playlist');
const PlayHistory = require('../models/playHistory');
const SongPlaylist = require('../models/songPlaylist');
const https = require('https');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;

// Configure axios-retry
axiosRetry(axios, {
    retries: 3, // Number of retries
    retryDelay: (retryCount) => {
        return retryCount * 2000; // Wait 2 seconds between retries
    },
    shouldResetTimeout: true, // Reset timeout after each retry
});

// Get all songs
exports.getAllSongs = async (req, res) => {
    try {
        const songs = await Song.findAll();
        res.render('admin/songs', {
            songs,
            title: 'Manage Songs'
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get a song by ID
exports.getSongById = async (req, res) => {
    try {
        const song = await Song.findByPk(req.params.songId);
        const playlists = await officialPlaylist();
        const userPlaylists = await userPlaylist(req.user.username);
        const topSongs = await getTopSongs();
        const topSongsUsers = await getTopSongsForUser(req.user.username);
        const latestUploads = await getLatestUpload();

        if (song) {
            //res.status(200).json(song);
            res.render('user/songDetails', {
                song,
                playlists,
                userPlaylists,
                topSongs,
                topSongsUsers,
                latestUploads,
                title: 'Song Details',
                username: req.user.username
            });
        } else {
            res.status(404).json({ message: 'Song not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getSearchResult = async (req, res) => {
    try {
        const song = await Song.findByPk(req.params.songId);
        const playlists = await officialPlaylist();
        const userPlaylists = await userPlaylist(req.user.username);
        const topSongs = await getTopSongs();
        const topSongsUsers = await getTopSongsForUser(req.user.username);
        const latestUploads = await getLatestUpload();
        const searchedsongs = await suggestSongs(req.params.search);
    
        if (song) {
            res.render('user/searchResult', {
                song,
                searchedsongs,
                playlists,
                userPlaylists,
                topSongs,
                topSongsUsers,
                latestUploads,
                title: 'Song Details',
                username: req.user.username
            });
        } else {
            res.status(404).json({ message: 'Song not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getSongsByPlaylist = async (req, res) => {
    const playlistId = req.params.playlistId;
    const playlists = await officialPlaylist();
    const userPlaylists = await userPlaylist(req.user.username);
    const latestUploads = await getLatestUpload();

    try {
        const playlistWithSongs = await Song.findAll({
            include: {
                model: Playlist,
                where: { playlist_id: playlistId, official_playlist: true }, // You can add more conditions to filter by specific mood ID
                through: { attributes: [] }
            }
        });

        const playlistData = await Playlist.findOne({
            where: {
                playlist_id: playlistId,
                official_playlist: 1,
            }
        });

        if (!playlistData) {
            return res.status(404).json({ error: "Playlist not found" });
        }

        if (!playlistWithSongs) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        const topSongs = await getTopSongs();
        const topSongsUsers = await getTopSongsForUser(req.user.username);

        res.render('user/playlist.ejs', {
            playlistId,
            playlistWithSongs,
            playlists,
            userPlaylists,
            topSongs,
            topSongsUsers,
            latestUploads,
            playlistData,
            username: req.user.username,
            title: 'MoodTune - Playlist',
        });
    } catch (error) {
        console.error('Error fetching songs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getSongsByUserPlaylist = async (req, res) => {
    const playlistId = req.params.playlistId;
    const playlists = await officialPlaylist();
    const userPlaylists = await userPlaylist(req.user.username);

    try {
        const playlistWithSongs = await Song.findAll({
            include: {
                model: Playlist,
                where: { playlist_id: playlistId, official_playlist: false, created_by: req.user.username }, // You can add more conditions to filter by specific mood ID
                through: { attributes: [] }
            }
        });

        if (!playlistWithSongs) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        const topSongs = await getTopSongs();
        const topSongsUsers = await getTopSongsForUser(req.user.username);

        res.render('user/playlist.ejs', {
            playlistId,
            playlistWithSongs,
            playlists,
            userPlaylists,
            topSongs,
            topSongsUsers,
            username: req.user.username,
            title: 'MoodTune - My Playlist',
        });
    } catch (error) {
        console.error('Error fetching songs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getSongsByUserPlaylist2 = async (req, res) => {
    const playlistId = req.params.playlistId;
    const playlists = await officialPlaylist();
    const userPlaylists = await userPlaylist(req.user.username);

    try {
        const playlistWithSongs = await Song.findAll({
            include: {
                model: Playlist,
                where: { playlist_id: playlistId, official_playlist: false, created_by: req.user.username }, // You can add more conditions to filter by specific mood ID
                through: { attributes: [] }
            }
        });

        const playlistData = await Playlist.findOne({
            where: {
                playlist_id: playlistId,
                created_by: req.user.username,
                official_playlist: 0
            }
        });

        if (!playlistData) {
            return res.status(404).json({ message: "Playlist not found" });
        }

        if (!playlistWithSongs) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        const topSongs = await getTopSongs();
        const topSongsUsers = await getTopSongsForUser(req.user.username);
        const songs = await Song.findAll();

        const songsByTags = await Song.findAll({
            where: {
                tags: {
                    [Op.like]: `%${playlistData.playlist_name}%`  // This will search for songs containing the 'searchTag'
                }
            }
        });

        res.render('user/myPlaylist.ejs', {
            playlistData,
            playlistId,
            playlistWithSongs,
            playlists,
            userPlaylists,
            songs,
            songsByTags,
            topSongs,
            topSongsUsers,
            username: req.user.username,
            title: 'MoodTune - My Playlist',
        });
    } catch (error) {
        console.error('Error fetching songs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getLyrics = async (req, res) => {
    const { title, artist } = req.query;

    // Validate inputs
    if (!title || !artist) {
        return res.status(400).json({ message: 'Title and artist are required' });
    }

    try {
        const agent = new https.Agent({
            rejectUnauthorized: false, // Disable SSL certificate verification
        });

        // const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
        const response = await axios.get(`https://api.textyl.co/api/lyrics?q=${encodeURIComponent(artist)}%20${encodeURIComponent(title)}`, {
            httpsAgent: agent
        });
        if (response.data.length > 0) {
            res.json({ lyrics: response.data });
        } else {
            res.status(404).json({ message: 'Lyrics not found' });
        }
    } catch (error) {
        console.error('Error fetching lyrics:', error.response ? error.response.data : error.message);
        res.status(500).send('Error fetching lyrics');
    }
};

// for top songs
exports.updatePlayCountAndHistory = async (req, res) => {
    const songId = req.params.songId; // Extract the songId correctly
    const playlistId = req.params.playlistId;
    const username = req.user.username;

    try {
        // Increment the play count for the song
        await Song.increment('play_count', { where: { song_id: songId } });

        // Log the play event
        await PlayHistory.create({ song_id: songId, username, playlist_id: playlistId });

        currentPlaylistId = null;
        res.status(200).json({ message: 'Song played successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Error playing song' });
    }
};

// retrieve top songs
const getTopSongs = async () => {
    return await Song.findAll({
        order: [['play_count', 'DESC']],
        limit: 10
    });
};

// retrieve top songs per user
const getTopSongsForUser = async (username) => {
    const topSongIds = await PlayHistory.findAll({
        attributes: [
            'song_id',
            [Sequelize.fn('COUNT', Sequelize.col('song_id')), 'play_count']
        ],
        where: { username },
        group: ['song_id'],
        order: [[Sequelize.fn('COUNT', Sequelize.col('song_id')), 'DESC']],
        limit: 10,
        raw: true
    });

    const songIds = topSongIds.map(song => song.song_id);

    let songs = [];
    if (songIds.length > 0) {
        songs = await Song.findAll({
            where: { song_id: songIds },
            attributes: ['song_id', 'title', 'artist', 'file_url', 'cover_image_url'],
            order: [
                [Sequelize.literal(`FIELD(song_id, ${songIds.join(',')})`), 'ASC']
            ]
        });
    }

    // Map songs to include play count
    return songs.map(song => {
        const playCountEntry = topSongIds.find(entry => entry.song_id === song.song_id);
        return {
            ...song.toJSON(),
            play_count: playCountEntry ? playCountEntry.play_count : 0,
        };
    });
};

const officialPlaylist = async () => {
    try {
        const playlists = await Playlist.findAll({
            where: {
                official_playlist: true
            }
        });
        return playlists;
    } catch (error) {
        throw new Error('Error fetching official playlists: ' + error.message);
    }
};

const userPlaylist = async (createdBy) => {
    try {
        const playlists = await Playlist.findAll({
            where: {
                official_playlist: false,
                created_by: createdBy
            }
        });
        return playlists;
    } catch (error) {
        throw new Error('Error fetching user playlists: ' + error.message);
    }
};

const getLatestUpload = async () => {
    return await Song.findAll({
        limit: 50,                     
        order: [['song_id', 'DESC']]    
    });
};

exports.assignSongsToPlaylist = async (req, res) => {
    const { songId, playlistId } = req.body;
    try {
        const song = await Song.findByPk(songId);
        const playlist = await Playlist.findByPk(playlistId);

        if (!song) {
            return res.status(404).json({ error: 'Song not found' });
        }
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        const existingAssociation = await SongPlaylist.findOne({
            where: {
                song_id: songId,
                playlist_id: playlistId
            }
        });

        if (existingAssociation) {
            return res.status(400).json({ error: 'This song is already assigned to the playlist' });
        }

        await SongPlaylist.create({ song_id: songId, playlist_id: playlistId });

        res.status(200).json({ message: 'Song successfully added to playlist' });
    } catch (error) {
        console.error('Error adding song to playlist:', error);
        res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }
};

exports.searchSong = async (req, res) => {
    const searchTerm = req.query.q;

    if (!searchTerm) {
        return res.status(400).json({ error: 'Query parameter `q` is required' });
    }

    try {
        const songs = await Song.findAll({
            where: {
                [Op.or]: [
                    { title: { [Op.like]: `%${searchTerm}%` } },
                    { artist: { [Op.like]: `%${searchTerm}%` } }
                ]
            },
            limit: 10,
            attributes: ['song_id', 'title', 'artist'],
        });

        res.json(songs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong while searching for songs' });
    }
};

exports.suggestSong = async (req, res) => {
    const userInput = req.body.search;

    if (!userInput || typeof userInput !== 'string' || userInput.trim() === '') {
        return res.status(400).json({ message: 'Please enter a valid search.' });
    }

    try {
        const songs = await Song.findAll({
            where: {
                [Sequelize.Op.or]: [
                    { title: { [Sequelize.Op.like]: `%${userInput.trim()}%` } },
                    { artist: { [Sequelize.Op.like]: `%${userInput.trim()}%` } },
                    { tags: { [Sequelize.Op.like]: `%${userInput.trim()}%` } }
                ]
            }
        });

        if (songs && songs.length > 0) {
            return res.json({ songs });
        } else {
            return res.json({
                message: 'No songs found matching your search!'
            });
        }
    } catch (error) {
        console.error('Error fetching songs:', error.message || error);

        return res.status(500).json({
            message: 'Something went wrong while fetching the songs. Please try again later.'
        });
    }
};

exports.refreshTopSongs = async (req, res) => {
    const topSongs = await getTopSongs(); 
    res.json(topSongs);
};

exports.refreshMostPlayed = async (req, res) => {
    const topSongsUsers = await getTopSongsForUser(req.user.username);
    res.json(topSongsUsers);
};

const suggestSongs = async (search) => {
    const userInput = search;

    const songs = await Song.findAll({
        where: {
            [Sequelize.Op.or]: [
                { title: { [Sequelize.Op.like]: `%${userInput.trim()}%` } },
                { artist: { [Sequelize.Op.like]: `%${userInput.trim()}%` } },
                { tags: { [Sequelize.Op.like]: `%${userInput.trim()}%` } }
            ]
        }
    });

    return songs;
};

exports.songDetails = async (req ,res) => {
    const songId = req.params.songId;

    const song = await Song.findByPk(songId);
    if (song) {
        res.json({
            title: song.title,
            artist: song.artist,
            cover_image_url: song.cover_image_url,
            lyrics_url: song.lyrics_url 
        });
    } else {
        res.status(404).json({ error: 'Song not found' });
    }
}