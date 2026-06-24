const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const pinoHttp = require('pino-http');

const authMiddleware = require('./middleware/auth');
const db = require('./persistence');
const logger = require('./logger');
const { register: metricsRegister, metricsMiddleware } = require('./metrics');

// Item routes
const getGreeting = require('./routes/getGreeting');
const getItems = require('./routes/getItems');
const addItem = require('./routes/addItem');
const updateItem = require('./routes/updateItem');
const deleteItem = require('./routes/deleteItem');

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
    app.get('/api/greeting', getGreeting);

    // ── Protected routes ───────────────────────────────────────────────────────
    // JWT issued by the auth service is verified locally with the shared
    // JWT_SECRET — no network call to the auth service per request.
    app.get('/api/items', authMiddleware, getItems);
    app.post('/api/items', authMiddleware, addItem);
    app.put('/api/items/:id', authMiddleware, updateItem);
    app.delete('/api/items/:id', authMiddleware, deleteItem);

    return app;
}

module.exports = { createApp };
