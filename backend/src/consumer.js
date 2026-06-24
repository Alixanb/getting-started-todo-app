/**
 * Kafka consumer for the task (backend) service.
 *
 * Subscribes to `user-events` and reacts to `user.deleted` by purging the
 * deleted user's todo items from this service's own database. This replaces the
 * previous cross-database DELETE the auth service used to perform — auth and
 * task now own separate databases and communicate only through the message bus.
 */
const db = require('./persistence');
const cache = require('./cache');
const bus = require('./bus');
const logger = require('./logger');

const TOPIC = 'user-events';
const GROUP_ID = 'task-user-events';

async function handleUserEvent(payload) {
    if (payload?.type === 'user.deleted' && payload.userId) {
        await db.deleteUserItems(payload.userId);
        await cache.del(`items:${payload.userId}`);
        logger.info({ userId: payload.userId }, 'purged items for deleted user');
    }
}

async function startUserEventsConsumer() {
    await bus.startConsumer(GROUP_ID, TOPIC, handleUserEvent);
}

module.exports = { startUserEventsConsumer, handleUserEvent, TOPIC, GROUP_ID };
