/**
 * Kafka message-bus helper (kafkajs).
 *
 * Enabled only when KAFKA_BROKERS is set — same opt-in pattern as cache/db.
 * When disabled, publish() is a no-op and startConsumer() does nothing.
 * Publishing is best-effort: a broker error is logged but never propagated to
 * the HTTP request path.
 */
const logger = require('./logger');

const BROKERS = process.env.KAFKA_BROKERS;
const CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'todo-app';

let kafka = null;
let producer = null;
let consumer = null;

function enabled() {
    return Boolean(BROKERS);
}

function getKafka() {
    if (!kafka) {
        const { Kafka, logLevel } = require('kafkajs');
        kafka = new Kafka({
            clientId: CLIENT_ID,
            brokers: BROKERS.split(','),
            logLevel: logLevel.NOTHING,
            retry: { retries: 8, initialRetryTime: 300 },
        });
    }
    return kafka;
}

async function connectProducer() {
    if (!enabled()) {
        logger.info('bus disabled (KAFKA_BROKERS not set)');
        return;
    }
    producer = getKafka().producer();
    await producer.connect();
    logger.info(`bus producer connected to ${BROKERS}`);
}

async function publish(topic, key, message) {
    if (!enabled() || !producer) return;
    try {
        await producer.send({
            topic,
            messages: [{ key: String(key), value: JSON.stringify(message) }],
        });
        logger.info({ topic, key }, 'event published');
    } catch (err) {
        logger.error({ err, topic }, 'bus publish failed');
    }
}

// Idempotently create the topic so a consumer can subscribe even before the
// first message is produced (avoids the "does not host this topic-partition"
// race on a fresh broker). createTopics resolves false if it already exists.
async function ensureTopic(topic) {
    const admin = getKafka().admin();
    try {
        await admin.connect();
        await admin.createTopics({
            topics: [{ topic, numPartitions: 1, replicationFactor: 1 }],
        });
    } catch (err) {
        logger.error({ err, topic }, 'ensureTopic failed');
    } finally {
        try {
            await admin.disconnect();
        } catch {
            /* ignore */
        }
    }
}

async function startConsumer(groupId, topic, handler) {
    if (!enabled()) {
        logger.info('bus consumer disabled (KAFKA_BROKERS not set)');
        return;
    }
    await ensureTopic(topic);
    consumer = getKafka().consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    await consumer.run({
        eachMessage: async ({ message }) => {
            try {
                const payload = JSON.parse(message.value.toString());
                await handler(payload);
            } catch (err) {
                logger.error({ err }, 'bus consume failed');
            }
        },
    });
    logger.info(`bus consumer "${groupId}" subscribed to ${topic}`);
}

async function disconnect() {
    try {
        if (producer) await producer.disconnect();
    } catch {
        /* ignore */
    }
    try {
        if (consumer) await consumer.disconnect();
    } catch {
        /* ignore */
    }
}

module.exports = { enabled, connectProducer, publish, startConsumer, disconnect };
