const Song = require('../models/song');
const Playlist = require('../models/playlist');

exports.getGuest = async (req, res) => {
    try {
        const playlists = await Playlist.findAll();
        const songs = await Song.findAll();
        res.render('index.ejs', {
            playlists,
            songs,
            title: 'Moodtune - Homepage',
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getLogin = async (req, res) => {
    res.render("login.ejs");
};

exports.getRegistration = (req, res) => {
    res.render("registration.ejs");
};

exports.getSuggestion = async (req, res) => {
    const username = req.user.username;
    const userPlaylists = await userPlaylist(req.user.username);
    const itemsPerPage = 10;  
    const page = parseInt(req.query.page) || 1; 
    const offset = (page - 1) * itemsPerPage;  
    const totalSongs = await Song.count();
    const songs = await Song.findAll({
        limit: itemsPerPage,
        offset: offset
    });
    const totalPages = Math.ceil(totalSongs / itemsPerPage);

    res.render("user/suggestion.ejs", {
        username,
        songs,
        currentPage: page,
        totalPages: totalPages,
        userPlaylists
    });
};

exports.getSuggestSong = async (req, res) => {
    res.render("user/suggestSongs.ejs");
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