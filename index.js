// Import dependencies
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { Sequelize } = require('sequelize');
const userRoutes = require('./routes/routes');
const config = require('./config/config.js')[process.env.NODE_ENV || 'development'];
const sequelize = new Sequelize(config.database, config.username, config.password, config);
const methodOverride = require('method-override');
require('./models/associations');

// Create an Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse URL-encoded bodies (required for form submissions)
app.use(express.urlencoded({ extended: true }));

// Use method-override to allow other HTTP methods in forms
app.use(methodOverride('_method')); // Use query parameter '_method' to override HTTP methods

// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Middleware to parse JSON requests
app.use(cookieParser());    // Middleware to parse cookies

// Serve static files from "node_modules/bootstrap/dist"
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use('/fontawesome/css', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/css')));
app.use('/fontawesome/webfonts', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/webfonts')));

// Serve static files from the "public" directory
app.use(express.static('public'));

// Routes
app.use('/', userRoutes);

// Sync database and start server
(async () => {
    try {
        await sequelize.sync();
        console.log('Database synced');

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Error syncing database:', err);
    }
})();
