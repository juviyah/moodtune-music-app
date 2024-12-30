const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const homeController = require('../controllers/homeController');
const adminController = require('../controllers/adminController');
const musicController = require('../controllers/musicController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authRole');

const preventCaching = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache'); 
    res.setHeader('Expires', '0');
    next();
};

router.get('/login', homeController.getLogin);
router.post('/login', userController.loginUser);
router.get('/registration', homeController.getRegistration);
router.get('/suggestion', preventCaching, authMiddleware, homeController.getSuggestion);
router.get('/suggest-song', preventCaching, authMiddleware, homeController.getSuggestSong);
router.post('/suggest-song', authMiddleware, musicController.suggestSong);

// Apply the authMiddleware to routes that require authentication
router.get('/', preventCaching, authMiddleware, userController.getUserPage);
router.get('/logout', authMiddleware, userController.getUserLogout);
router.post('/users', preventCaching, userController.createUser);
router.get('/users/:username', preventCaching, authMiddleware, userController.getUserById);
router.get('/profile/:username', preventCaching, authMiddleware, userController.getProfile);
router.put('/users/:username', authMiddleware, userController.updateUser);
router.delete('/users/:username', authMiddleware, userController.deleteUser);
router.get('/downloads', authMiddleware, userController.getDownloads);
router.post('/feedback', authMiddleware, userController.createFeedback);
router.get('/getTopSongs', authMiddleware, musicController.refreshTopSongs);
router.get('/getTopSongsUsers', authMiddleware, musicController.refreshMostPlayed);

// protected admin routes
//Dashboard
router.get('/admin/dashboard', preventCaching, authMiddleware, authorizeRole('admin'), adminController.getAdminPage);
router.put('/admin/dashboard/reset-play-count', authMiddleware, authorizeRole('admin'), adminController.resetTopTracks);
// User
router.get('/admin/users', preventCaching, authMiddleware, authorizeRole('admin'), adminController.getAllUsers);
router.post('/admin/users', authMiddleware, authorizeRole('admin'), adminController.createUser);
router.get('/admin/users/:id', preventCaching, authMiddleware, authorizeRole('admin'), adminController.getUserById);
router.put('/admin/users/:username', authMiddleware, authorizeRole('admin'), adminController.updateUser);
router.delete('/admin/users/:username', authMiddleware, authorizeRole('admin'), adminController.deleteUser);
router.post('/admin/users/deactivate/:username', authMiddleware, authorizeRole('admin'), adminController.deactivateUser);
router.post('/admin/users/activate/:username', authMiddleware, authorizeRole('admin'), adminController.activateUser);
// Song
router.get('/admin/songs', authMiddleware, authorizeRole('admin'), adminController.getAllSongs);
router.post('/admin/songs', authMiddleware, authorizeRole('admin'), adminController.createSong);
router.get('/admin/songs/:id', authMiddleware, adminController.getSongById);
router.put('/admin/songs/:song_id', authMiddleware, adminController.updateSong);
router.delete('/admin/songs/:song_id', authMiddleware, authorizeRole('admin'), adminController.deleteSong);
// Playlist
router.get('/admin/playlist', preventCaching, authMiddleware, authorizeRole('admin'), adminController.getAllPlaylist);
router.post('/admin/playlist', authMiddleware, adminController.createPlaylist);
router.get('/admin/playlist/:playlist_id', preventCaching, authMiddleware, authorizeRole('admin'), adminController.getPlaylistById);
router.put('/admin/playlist/:playlist_id', authMiddleware, authorizeRole('admin'), adminController.updatePlaylist);
router.delete('/admin/playlist/:playlist_id', authMiddleware, authorizeRole('admin'), adminController.deletePlaylist);
// ** Assign Song to Playlist (admin) **
router.get('/admin/playlist/:playlistId/songs', preventCaching, authMiddleware, authorizeRole('admin'), adminController.getSongsByPlaylist);
router.post('/admin/assignSong', authMiddleware, adminController.assignPlaylistToSong);
router.delete('/admin/playlist/:playlist_id/songs/:song_id', authMiddleware, authorizeRole('admin'), adminController.deleteSongPlaylist);
// ** Assign Song to Playlist (user) **
router.post('/assignSong', authMiddleware, musicController.assignSongsToPlaylist);

// Song Routes 
router.get('/search', musicController.searchSong);
router.get('/songs', preventCaching, authMiddleware, musicController.getAllSongs);
router.post('/songs', preventCaching, authMiddleware, adminController.createSong);
router.get('/browse-more', preventCaching, authMiddleware, userController.getBrowseMore);
router.get('/song-details/:songId', preventCaching, authMiddleware, musicController.songDetails);
router.get('/songs/:search/:songId', preventCaching, authMiddleware, musicController.getSearchResult);
router.get('/songs/:songId', preventCaching, authMiddleware, musicController.getSongById);
router.get('/playlist/:playlistId', preventCaching, authMiddleware, musicController.getSongsByPlaylist);
router.get('/my-playlist/:playlistId', preventCaching, authMiddleware, musicController.getSongsByUserPlaylist2);
router.post('/playlist/:playlistId/songs/:songId', authMiddleware, musicController.updatePlayCountAndHistory);
router.delete('/my-playlist/:playlist_id', authMiddleware, adminController.deleteUserPlaylist);
router.delete('/my-playlist/:playlist_id/songs/:song_id', authMiddleware, adminController.deleteSongPlaylist);
router.get('/official-playlist', authMiddleware, userController.getOfficialPlaylists);
router.get('/official-playlist/:playlistId', preventCaching, authMiddleware, musicController.getSongsByPlaylist);

// APIs
router.get('/icons', authMiddleware, adminController.getIcons);
router.get('/lyrics', authMiddleware, musicController.getLyrics);

// Other routes
router.post('/request-password-reset', userController.requestPasswordReset);
router.get('/reset-password', userController.getResetPassword);
router.post('/reset-password', userController.resetPassword);

module.exports = router;