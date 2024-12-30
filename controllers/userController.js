const { Sequelize } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const transporter = require('../config/mailer');
const { redirect } = require('express/lib/response');
const User = require('../models/user');
const Song = require('../models/song');
const Playlist = require('../models/playlist');
const PlayHistory = require('../models/playHistory');
const Feedback = require('../models/feedback');
const validatePassword = require('../utils/passwordValidator');


const SECRET_KEY = process.env.ACCESS_TOKEN_SECRET;

const passwordRequirements = {
    minLength: 8,
    maxLength: 20,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
};

exports.getUserPage = async (req, res) => {
    try {
        const playlists = await officialPlaylist();
        const moodPlaylists = await moodPlaylist(req.user.username);
        const activityPlaylists = await activityPlaylist(req.user.username);
        const userPlaylists = await userPlaylist(req.user.username);
        const songs = await Song.findAll();
        const topSongs = await getTopSongs();
        const latestUploads = await getLatestUpload();
        const topSongsUsers = await getTopSongsForUser(req.user.username);

        res.render('user/welcome.ejs', {
            playlists,
            moodPlaylists,
            activityPlaylists,
            userPlaylists,
            songs,
            topSongs,
            topSongsUsers,
            latestUploads,
            title: 'Moodtune - Homepage',
            username: req.user.username
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getBrowseMore = async (req, res) => {
    try {
        const playlists = await officialPlaylist();
        const moodPlaylists = await moodPlaylist(req.user.username);
        const activityPlaylists = await activityPlaylist(req.user.username);
        const userPlaylists = await userPlaylist(req.user.username);
        const allSongs = await Song.findAll();
        const topSongs = await getTopSongs();
        const latestUploads = await getLatestUpload();
        const topSongsUsers = await getTopSongsForUser(req.user.username);

        res.render('user/allSongs.ejs', {
            playlists,
            moodPlaylists,
            activityPlaylists,
            userPlaylists,
            allSongs,
            topSongs,
            topSongsUsers,
            latestUploads,
            title: 'Moodtune - Homepage',
            username: req.user.username
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getOfficialPlaylists = async (req, res) => {
    try {
        const playlists = await officialPlaylist();
        const userPlaylists = await userPlaylist(req.user.username);
        const songs = await Song.findAll();
        const topSongs = await getTopSongs();
        const topSongsUsers = await getTopSongsForUser(req.user.username);
        const latestUploads = await getLatestUpload();

        res.render('user/officialPlaylist.ejs', {
            playlists,
            userPlaylists,
            songs,
            topSongs,
            topSongsUsers,
            latestUploads,
            title: 'Moodtune - Official Playlist',
            username: req.user.username
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        const passwordValidationMessage = validatePassword(password, passwordRequirements);
        if (passwordValidationMessage) {
            return res.status(400).json({ message: passwordValidationMessage });
        }

        // check if username or email already exists
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

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create new user if not existss
        const user = await User.create({ username, email, password: hashedPassword, role: "user" });
        
        // Exclude the password from the response
        const { password: _, ...userWithoutPassword } = user.toJSON();
        res.status(201).json({
                message: 'User created successfully',
                userWithoutPassword
            });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.username);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const playlists = await officialPlaylist();
        const userPlaylists = await userPlaylist(req.user.username);
        const songs = await Song.findAll();
        const topSongs = await getTopSongs();
        const topSongsUsers = await getTopSongsForUser(req.user.username);
        const userDetail = await User.findByPk(req.params.username);
        const latestUploads = await getLatestUpload();

        res.render('user/profile.ejs', {
            playlists,
            userPlaylists,
            songs,
            topSongs,
            topSongsUsers,
            title: 'Moodtune - Profile',
            username: req.user.username,
            userDetail,
            latestUploads
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        if (req.body.role && req.body.role === 'admin') {
            return res.status(403).json({ error: 'You cannot update your role to "admin".' });
        }

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
            res.redirect('/users');
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find the user by username
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.status === 'inactive') {
            return res.status(403).json({ message: 'Your account is inactive.' });
        }

        // Compare passwords
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        const playlists = await userPlaylist(user.username);

        const token = jwt.sign({ username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });  
        
        // Set cookie with JWT
        res.cookie('token', token, {
            httpOnly: true,  // Prevent client-side JavaScript access
            secure: process.env.NODE_ENV === 'development', // Only use secure cookies in production
            maxAge: 3600000   // 1 hour
        });

        // Check the user role and respond with the appropriate URL
        if (user.role === 'admin') {
            res.json({ message: 'Login successful', redirectUrl: '/admin/dashboard' });
        } else {
            if (playlists.length === 0) {
                res.json({ message: 'Login successful', redirectUrl: '/suggestion' });
            } else {
                res.json({ message: 'Login successful', redirectUrl: '/suggest-song' });
            }
        }
    } catch (error) {
        console.error('Login Error:', error); // Log the error to the console
        res.status(500).json({ message: 'Error logging in', error });
    }
};

const getTopSongs = async () => {
    return await Song.findAll({
        order: [['play_count', 'DESC']],
        limit: 10
    });
};

const getLatestUpload = async () => {
    return await Song.findAll({
        limit: 50,                     
        order: [['song_id', 'DESC']]    
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

exports.getUserLogout = async (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
  };

exports.getDownloads = async (req, res) => {
    try {
        const playlists = await officialPlaylist();
        const userPlaylists = await userPlaylist(req.user.username);
        const songs = await Song.findAll();
        const topSongs = await getTopSongs();
        const topSongsUsers = await getTopSongsForUser(req.user.username);
        const latestUploads = await getLatestUpload();

        res.render('user/download', {
            playlists,
            userPlaylists,
            songs,
            topSongs,
            topSongsUsers,
            latestUploads,
            title: 'Moodtune - Downloads',
            username: req.user.username
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.requestPasswordReset = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const token = jwt.sign({ username: user.username, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '1h' });  
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    await transporter.sendMail({
        to: email,
        subject: 'Password Reset',
        text: `Click here to reset your password: ${resetLink}`,
    });

    res.json({ message: 'Password reset email sent' });
};

exports.getResetPassword = async (req, res) => {
    const { token } = req.query;
    
    if (!token) {
        return res.status(400).send('Token is required.');
    }
    
    res.render('resetPassword', { token });
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required.' });
    }

    const passwordValidationMessage = validatePassword(newPassword, passwordRequirements);
    if (passwordValidationMessage) {
        return res.status(400).json({ message: passwordValidationMessage });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await User.findOne({ where: { email: decoded.email } });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token.' });
        } else if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Token has expired.' });
        }
        
        console.error('Error resetting password:', error);
        return res.status(500).json({ message: 'An error occurred while resetting the password.' });
    }
};

exports.createFeedback = async (req, res) => {
    const username = req.user.username;
    const feedback_text = req.body.feedback_text;

    try {
        const feedback = await Feedback.create({ username, feedback_text });
        res.status(201).json(feedback);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to submit feedback' });
    }
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

const moodPlaylist = async (createdBy) => {
    try {
        const moodPlaylists = await Playlist.findAll({
            where: {
                created_by: createdBy,
                playlist_type: 'Mood'
            }
        });
        return moodPlaylists;
    } catch (error) {
        throw new Error('Error fetching mood playlists: ' + error.message);
    }
};

const activityPlaylist = async (createdBy) => {
    try {
        const activityPlaylists = await Playlist.findAll({
            where: {
                created_by: createdBy,
                playlist_type: 'Activity'
            }
        });
        return activityPlaylists;
    } catch (error) {
        throw new Error('Error fetching activity playlists: ' + error.message);
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
