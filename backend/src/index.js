const { createApp } = require('./app');
const db = require('./persistence');
const logger = require('./logger');

const app = createApp();

db.init()
    .then(() => {
        app.listen(3000, () => logger.info('Listening on port 3000'));
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
