/**
 * Redis cache-aside helper.
 *
 * Enabled only when REDIS_HOST is set — same opt-in pattern as persistence/
 * (MYSQL_HOST). When disabled, every method is a no-op so the service simply
 * always reads from the database. Redis errors are never fatal: they are logged
 * and treated as a cache miss, so a Redis outage degrades gracefully.
 */
const logger = require('./logger');
const { cacheHits, cacheMisses } = require('./metrics');

const HOST = process.env.REDIS_HOST;
const PORT = Number(process.env.REDIS_PORT || 6379);
const DEFAULT_TTL = Number(process.env.CACHE_TTL_SECONDS || 60);

let client = null;
let ready = false;

async function connect() {
    if (!HOST) {
        logger.info('cache disabled (REDIS_HOST not set)');
        return;
    }
    const { createClient } = require('redis');
    client = createClient({ socket: { host: HOST, port: PORT } });
    client.on('error', (err) => {
        ready = false;
        logger.error({ err }, 'redis error');
    });
    client.on('ready', () => {
        ready = true;
    });
    await client.connect();
    ready = true;
    logger.info(`cache connected to redis at ${HOST}:${PORT}`);
}

async function get(key) {
    if (!client || !ready) {
        cacheMisses.inc();
        return null;
    }
    try {
        const val = await client.get(key);
        if (val == null) {
            cacheMisses.inc();
            return null;
        }
        cacheHits.inc();
        return JSON.parse(val);
    } catch (err) {
        logger.error({ err, key }, 'cache get failed');
        cacheMisses.inc();
        return null;
    }
}

async function set(key, value, ttl = DEFAULT_TTL) {
    if (!client || !ready) return;
    try {
        await client.set(key, JSON.stringify(value), { EX: ttl });
    } catch (err) {
        logger.error({ err, key }, 'cache set failed');
    }
}

async function del(key) {
    if (!client || !ready) return;
    try {
        await client.del(key);
    } catch (err) {
        logger.error({ err, key }, 'cache del failed');
    }
}

async function disconnect() {
    if (client) {
        try {
            await client.quit();
        } catch {
            /* ignore */
        }
    }
}

module.exports = { connect, get, set, del, disconnect };
