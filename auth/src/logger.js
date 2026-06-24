/**
 * Structured logger (pino).
 *
 * Emits one JSON object per line so logs can be shipped to Loki/Promtail
 * without parsing. The log level is configurable via LOG_LEVEL (default
 * "info", or "silent" during tests to keep test output clean).
 */
const pino = require('pino');

const level =
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === 'test' ? 'silent' : 'info');

const logger = pino({ level });

module.exports = logger;
