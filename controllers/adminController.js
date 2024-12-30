const { Sequelize } = require('sequelize');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const User = require('../models/user');
const Song = require('../models/song');
const Playlist = require('../models/playlist');
const SongPlaylist = require('../models/songPlaylist');
const PlayHistory = require('../models/playHistory');
const Feedback = require('../models/feedback');
const OAuth = require('oauth');
const validatePassword = require('../utils/passwordValidator');

const passwordRequirements = {
    minLength: 8,
    maxLength: 20,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
};

exports.getAdminPage = async (req, res) => {
    const topSongs = await getTopSongs();
    const topUsers = await getTopUsers();
    const recentPlays = await getRecentPlayed();
    const songCount = await Song.count();
    const playlistCount = await Playlist.count();
    const userCount = await User.count();
    const topPlaylists = await getPlaylistStats();
    const feedbacks = await getFeedback();
    
    res.render('admin/dashboard', { 
        topSongs,
        topUsers,
        recentPlays,
        songCount,
        playlistCount,
        userCount,
        topPlaylists,
        feedbacks,
        title: 'Admin Dashboard'
    });
};

exports.getAllUsers = async (req, res) => {
    try {
        const itemsPerPage = 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * itemsPerPage;
        const totalUsers = await User.count({
            where: {
                role: { [Sequelize.Op.ne]: 'admin' }
            }
        });
        const users = await User.findAll({
            where: {
                role: { [Sequelize.Op.ne]: 'admin' }
            },
            limit: itemsPerPage,
            offset: offset
        });

        const totalPages = Math.ceil(totalUsers / itemsPerPage);

        res.render('admin/users', {
            users,
            title: 'Manage Users',
            currentPage: page,
            totalPages,
            totalUsers
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        const passwordValidationMessage = validatePassword(password, passwordRequirements);
        if (passwordValidationMessage) {
            return res.status(400).json({ message: passwordValidationMessage });
        }

        const existingUser = await User.findOne({
            where: {
                [Op.or]: [{ username }, { email }]
            }
        });

        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(400).json({ message: 'Username already exists' });
            }
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email already exists' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({ username, email, password: hashedPassword, role });
        
        const { password: _, ...userWithoutPassword } = user.toJSON();
        res.status(201).json({
            message: 'User created successfully',
            userWithoutPassword
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const [updated] = await User.update(req.body, {
            where: { username: req.params.username }
        });

        if (updated) {
            res.status(200).json('User updated successfully!');
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const username = req.params.username;

        const deleted = await User.destroy({
            where: { username: username }
        });

        if (deleted) {
            res.redirect('/admin/users');
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Manage Songs
exports.getAllSongs = async (req, res) => {
    try {
        const itemsPerPage = 10;  
        const page = parseInt(req.query.page) || 1; 
        const offset = (page - 1) * itemsPerPage;  
        const totalSongs = await Song.count();
        const songs = await Song.findAll({
            limit: itemsPerPage,
            offset: offset
        });
        const totalPages = Math.ceil(totalSongs / itemsPerPage);

        res.render('admin/songs', {
            username: req.user.username,
            songs,
            title: 'Manage Songs',
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = file.mimetype.startsWith('audio/') ? 'public/music' : 'public/images';
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage }).fields([
    { name: 'file', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
]);

// Handler for creating a song
exports.createSong = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error uploading files' });
        }

        try {
            const { title, artist, album, duration, created_by, tags } = req.body;
            const file = req.files['file'] ? req.files['file'][0].filename : null;
            const coverImage = req.files['coverImage'] ? req.files['coverImage'][0].filename : null;

            const fileUrl = file ? `music/${file}` : null;
            const coverImageUrl = coverImage ? `images/${coverImage}` : null;

            const newSong = await Song.create({
                title,
                artist,
                album,
                duration,
                created_by,
                tags,
                file_url: fileUrl,
                cover_image_url: coverImageUrl
            });

            res.status(201).json(newSong);
        } catch (error) {
            console.error('Error creating song:', error);
            res.status(500).json({ error: 'An error occurred while creating the song' });
        }
    });
};

exports.getSongById = async (req, res) => {
    try {
        const song = await Song.findByPk(req.params.id);

        if (song) {
            res.status(200).json(song);
        } else {
            res.status(404).json({ message: 'Song not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateSong = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error uploading files' });
        }

        const songId = req.params.song_id;

        try {
            const { title, artist, album, duration, tags } = req.body;
            const newFile = req.files['file'] ? req.files['file'][0].filename : null;
            const newCoverImage = req.files['coverImage'] ? req.files['coverImage'][0].filename : null;

            const song = await Song.findByPk(songId);
            if (!song) {
                return res.status(404).json({ error: 'Song not found' });
            }

            if (newFile && song.file_url) {
                const oldFilePath = path.join(__dirname, '../public', song.file_url);
                fs.unlink(oldFilePath, (err) => {
                    if (err) {
                        console.error('Error deleting old file:', err);
                    }
                });
            }

            if (newCoverImage && song.cover_image_url) {
                const oldCoverImagePath = path.join(__dirname, '../public', song.cover_image_url);
                fs.unlink(oldCoverImagePath, (err) => {
                    if (err) {
                        console.error('Error deleting old cover image:', err);
                    }
                });
            }

            await song.update({
                title,
                artist,
                album,
                duration,
                tags,
                file_url: newFile ? `music/${newFile}` : song.file_url,
                cover_image_url: newCoverImage ? `images/${newCoverImage}` : song.cover_image_url
            });

            res.status(200).json(song);
        } catch (error) {
            console.error('Error updating song:', error);
            res.status(500).json({ error: 'An error occurred while updating the song' });
        }
    });
};

exports.resetTopTracks = async (req, res) => {
    try {
        await Song.update({ play_count: 0 }, { where: {} });
        res.status(200).json({ message: 'Play count reset for all songs.' })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.deleteSong = async (req, res) => {
    try {
        const songId = req.params.song_id;

        const deleted = await Song.destroy({
            where: { song_id: songId }
        });

        if (deleted) {
            res.redirect('/admin/songs');
        } else {
            res.status(404).json({ error: 'Song not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Manage Playlist
exports.getAllPlaylist = async (req, res) => {
    try {
        const playlists = await Playlist.findAll();
        const songs = await Song.findAll();
        const username = req.user.username;

        res.render('admin/playlist', {
            playlists,
            songs,
            username,
            title: 'Manage Playlist'
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.createPlaylist = async (req, res) => {
    try {
        const { playlist_name } = req.body;

        const playlistData = req.body;
        if (!playlistData.playlist_name) {
            return res.status(400).json({ error: 'Playlist name is required' });
        }
        if (!playlistData.playlist_type) {
            return res.status(400).json({ error: 'Playlist type is required' });
        }

        if (!playlist_name) {
            return res.status(400).json({ error: 'Playlist name is required' });
        }

        const playlist = await Playlist.create(playlistData);
        res.status(201).json(playlist);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getPlaylistById = async (req, res) => {
    try {
        const mood = await Mood.findByPk(req.params.id);
        if (mood) {
            res.status(200).json(mood);
        } else {
            res.status(404).json({ message: 'Mood not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updatePlaylist = async (req, res) => {
    try {
        const [updated] = await Mood.update(req.body, {
            where: { id: req.params.id }
        });
        if (updated) {
            const updatedMood = await Mood.findByPk(req.params.id);
            res.status(200).json(updatedMood);
        } else {
            res.status(404).json({ message: 'Mood not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deletePlaylist = async (req, res) => {
    try {
        const deleted = await Playlist.destroy({
            where: { playlist_id: req.params.playlist_id }
        });
        if (deleted) {
            res.status(200).json({ message: 'Playlist deleted successfully' });
        } else {
            res.status(404).json({ message: 'Playlist not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteUserPlaylist = async (req, res) => {
    try {
        const playlist = await Playlist.findOne({
            where: { playlist_id: req.params.playlist_id }
        });

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        if (playlist.created_by !== req.user.username) {
            return res.status(403).json({ message: 'You can only delete your own playlists' });
        }

        const deleted = await Playlist.destroy({
            where: { playlist_id: req.params.playlist_id }
        });
        
        if (deleted) {
            res.status(200).json({ message: 'Playlist deleted successfully' });
        } else {
            res.status(404).json({ message: 'Playlist not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.assignPlaylistToSong = async (req, res) => {
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

exports.getSongsByPlaylist = async (req, res) => {
    const playlistId = req.params.playlistId;
    try {
        const playlistWithSongs = await Song.findAll({
            include: {
                model: Playlist,
                where: { playlist_id: playlistId }, 
                through: { attributes: [] }
            }
        });

        if (!playlistWithSongs) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        res.status(200).json(playlistWithSongs); 
    } catch (error) {
        console.error('Error fetching songs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteSongPlaylist = async (req, res) => {
    const { playlist_id, song_id } = req.params;

    console.log(playlist_id);
    console.log(song_id);

    try {
        const deleted = await SongPlaylist.destroy({
            where: {
                playlist_id: playlist_id,
                song_id: song_id
            }
        });

        if (deleted) {
            res.json({ success: true, playlistId: playlist_id });
        } else {
            return res.status(404).json({ message: 'Entry not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// get icons api
const NOUN_PROJECT_API_KEY = 'f32ff1ed2a2147439c9ec476cb931ed4';
const NOUN_PROJECT_API_SECRET = '6ec42ed0291145ff86383e025949058a';
const oauth = new OAuth.OAuth(
    'https://api.thenounproject.com',
    'https://api.thenounproject.com',
    NOUN_PROJECT_API_KEY,
    NOUN_PROJECT_API_SECRET,
    '1.0',
    null,
    'HMAC-SHA1'
);

exports.getIcons = async (req, res) => {
    const query = req.query.query;
    const apiUrl = `https://api.thenounproject.com/v2/icon?query=${encodeURIComponent(query)}&limit=12&thumbnail_size=84`;

    console.log('Fetching icons from:', apiUrl);

    try {
        oauth.get(apiUrl, null, null, async (err, data) => {
            if (err) {
                console.error('Error fetching icons:', err);
                return res.status(500).json({ error: 'Failed to fetch icons. Please try again later.' });
            }
            const parsedData = JSON.parse(data);
            res.json(parsedData);
        });
    } catch (error) {
        console.error('Error fetching icons:', error);
        res.status(500).json({ error: 'Failed to fetch icons. Please try again later.' });
    }
};

exports.deactivateUser = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ where: { username } });

        if (user) {
            if (user.role === 'admin') {
                return res.status(403).send('Cannot deactivate an admin user');
            }

            user.status = 'inactive';
            await user.save();
            res.redirect('/admin/users');
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
};


exports.activateUser = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ where: { username } });

        if (user) {
            if (user.role === 'admin') {
                return res.status(403).send('Cannot activate an admin user');
            }

            user.status = 'active';
            await user.save();
            res.redirect('/admin/users');
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// retrieve top songs
const getTopSongs = async () => {
    return await Song.findAll({
        order: [['play_count', 'DESC']],
        limit: 10
    });
};

// top users base play count in play history
const getTopUsers = async () => {
    try {
        const results = await PlayHistory.findAll({
            attributes: [
                'username',
                [Sequelize.fn('COUNT', Sequelize.col('song_id')), 'play_counts'],
            ],
            include: [{
                model: User,
                attributes: ['email'],
                where: {
                    role: {
                        [Sequelize.Op.ne]: 'admin',
                    },
                },
            }],
            group: ['username', 'User.email'],
        });
        
        return results.map(result => ({
            username: result.username,
            email: result.User.email, 
            play_count: result.getDataValue('play_counts'), 
        }));
    } catch (error) {
        console.error('Error fetching top users:', error);
        throw error;
    }
};

const getRecentPlayed = async () => {
    try {
        const results = await PlayHistory.findAll({
            include: [{
                model: Song,
                attributes: ['title', 'artist'],
            }],
            order: [['played_at', 'DESC']],
            limit: 10,
            attributes: ['username', 'played_at'], 
        });

        return results.map(record => ({
            title: record.Song.title,
            artist: record.Song.artist,
            played_by: record.username,
            played_at: record.played_at,
        }));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

async function getPlaylistStats() {
    try {
        const results = await PlayHistory.findAll({
            attributes: [
                ['playlist_id', 'playlist_id'], 
                [Sequelize.fn('COUNT', Sequelize.col('PlayHistory.playlist_id')), 'counts'], 
            ],
            include: [{
                model: Playlist,
                attributes: ['playlist_name', 'playlist_type', 'playlist_icon'],
            }],
            group: ['PlayHistory.playlist_id', 'Playlist.playlist_name', 'Playlist.playlist_type', 'Playlist.playlist_icon'],
            order: [[Sequelize.fn('COUNT', Sequelize.col('PlayHistory.playlist_id')), 'DESC']], 
            where: {
                'playlist_id': {
                    [Sequelize.Op.gt]: 0,
                },
            },
        });
        
        const formattedResults = results.map(item => ({
            playlist_id: item.playlist_id,
            counts: item.dataValues.counts, 
            playlist_name: item.Playlist.playlist_name,
            playlist_type: item.Playlist.playlist_type,
            playlist_icon: item.Playlist.playlist_icon,
        }));

        return formattedResults;
    } catch (error) {
        throw new Error(error.message);
    }
}

async function getFeedback() {
    const feedbacks = await Feedback.findAll();
    return feedbacks;
}
