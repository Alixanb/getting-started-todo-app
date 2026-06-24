const { createApp } = require('./app');
const db = require('./persistence');
const cache = require('./cache');
const bus = require('./bus');
const logger = require('./logger');

const PORT = process.env.PORT || 3001;

const app = createApp();

// Optional infra (cache, message bus) is best-effort: a Redis/Kafka outage at
// boot must not prevent the API from serving. Only the database gates startup.
async function connectOptionalInfra() {
    try {
        await cache.connect();
    } catch (err) {
        logger.error({ err }, 'cache connect failed (continuing without cache)');
    }
    try {
        await bus.connectProducer();
    } catch (err) {
        logger.error({ err }, 'bus connect failed (continuing without events)');
    }
}

db.init()
    .then(async () => {
        await connectOptionalInfra();
        app.listen(PORT, () => logger.info(`Listening on port ${PORT}`));
    })
    .catch((err) => {
        logger.error({ err }, 'failed to start');
        process.exit(1);
    });

const gracefulShutdown = () => {
    Promise.allSettled([db.teardown(), cache.disconnect(), bus.disconnect()]).then(
        () => process.exit(),
    );
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // Sent by nodemon
