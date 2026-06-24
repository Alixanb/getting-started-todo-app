const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');

const authMiddleware = require('./middleware/auth');
const db = require('./persistence');
const logger = require('./logger');
const { register: metricsRegister, metricsMiddleware } = require('./metrics');

// Auth routes
const register = require('./routes/auth/register');
const login = require('./routes/auth/login');
const logout = require('./routes/auth/logout');
const me = require('./routes/auth/me');
const updateMe = require('./routes/auth/updateMe');
const changePassword = require('./routes/auth/changePassword');
const deleteAccount = require('./routes/auth/deleteAccount');

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
    app.use(pinoHttp({ logger }));
    app.use(metricsMiddleware);
    app.use(express.json());
    app.use(cookieParser());

    // ── Observability endpoints ─────────────────────────────────────────────────
    // Liveness: process is up. No dependencies checked.
    app.get('/health', (req, res) => res.json({ status: 'ok' }));

    // Readiness: app can serve traffic (database reachable).
    app.get('/ready', async (req, res) => {
        try {
            await db.ping();
            res.json({ status: 'ready' });
        } catch (err) {
            req.log?.error({ err }, 'readiness check failed');
            res.status(503).json({ status: 'not ready' });
        }
    });

    // Prometheus scrape endpoint.
    app.get('/metrics', async (req, res) => {
        res.set('Content-Type', metricsRegister.contentType);
        res.send(await metricsRegister.metrics());
    });

    // ── Public routes ──────────────────────────────────────────────────────────
    app.post('/api/auth/register', authLimiter, register);
    app.post('/api/auth/login', authLimiter, login);
    app.post('/api/auth/logout', logout);

    // ── Protected routes ───────────────────────────────────────────────────────
    app.get('/api/auth/me', authMiddleware, me);
    app.put('/api/auth/me', authMiddleware, updateMe);
    app.put('/api/auth/me/password', authMiddleware, changePassword);
    app.delete('/api/auth/me', authMiddleware, deleteAccount);

    return app;
}

module.exports = { createApp };
