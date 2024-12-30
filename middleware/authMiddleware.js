const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.ACCESS_TOKEN_SECRET;

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/login');
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.redirect('/login'); 
        }
        req.user = user;
        next();
    });
};

module.exports = authMiddleware;
