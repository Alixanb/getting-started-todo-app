const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authMiddleware = require('./middleware/auth');

// Auth routes
const register = require('./routes/auth/register');
const login = require('./routes/auth/login');
const logout = require('./routes/auth/logout');
const me = require('./routes/auth/me');
const updateMe = require('./routes/auth/updateMe');
const changePassword = require('./routes/auth/changePassword');
const deleteAccount = require('./routes/auth/deleteAccount');

// Item routes
const getGreeting = require('./routes/getGreeting');
const getItems = require('./routes/getItems');
const addItem = require('./routes/addItem');
const updateItem = require('./routes/updateItem');
const deleteItem = require('./routes/deleteItem');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
});

function createApp() {
    const app = express();

    app.use(helmet());
    app.use(express.json());
    app.use(cookieParser());
    app.use(express.static(__dirname + '/static'));

    // ── Public routes ──────────────────────────────────────────────────────────
    app.get('/api/greeting', getGreeting);

    app.post('/api/auth/register', authLimiter, register);
    app.post('/api/auth/login', authLimiter, login);
    app.post('/api/auth/logout', logout);

    // ── Protected routes ───────────────────────────────────────────────────────
    app.get('/api/auth/me', authMiddleware, me);
    app.put('/api/auth/me', authMiddleware, updateMe);
    app.put('/api/auth/me/password', authMiddleware, changePassword);
    app.delete('/api/auth/me', authMiddleware, deleteAccount);

    app.get('/api/items', authMiddleware, getItems);
    app.post('/api/items', authMiddleware, addItem);
    app.put('/api/items/:id', authMiddleware, updateItem);
    app.delete('/api/items/:id', authMiddleware, deleteItem);

    // SPA fallback — serve index.html for all non-API routes so React Router works on refresh
    app.get('*', (req, res) => {
        res.sendFile(__dirname + '/static/index.html');
    });

    return app;
}

module.exports = { createApp };
