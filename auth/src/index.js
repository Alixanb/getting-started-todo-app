const { createApp } = require('./app');
const db = require('./persistence');
const logger = require('./logger');

const PORT = process.env.PORT || 3001;

const app = createApp();

db.init()
    .then(() => {
        app.listen(PORT, () => logger.info(`Listening on port ${PORT}`));
    })
    .catch((err) => {
        logger.error({ err }, 'failed to start');
        process.exit(1);
    });

const gracefulShutdown = () => {
    db.teardown()
        .catch(() => {})
        .then(() => process.exit());
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // Sent by nodemon
