/**
 * Prometheus metrics.
 *
 * Exposes a registry with:
 *  - default Node.js process metrics (CPU, memory, event loop, GC…)
 *  - a custom histogram measuring HTTP request duration, labelled by
 *    method, route and status code.
 *
 * The `metricsMiddleware` is mounted before the routes so every request is
 * timed, and `register` is rendered by the GET /metrics endpoint.
 */
const client = require('prom-client');

const register = new client.Registry();
register.setDefaultLabels({ app: 'todo-app' });
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register],
});

// Cache-aside (Redis) counters — incremented by src/cache.js.
const cacheHits = new client.Counter({
    name: 'cache_hits_total',
    help: 'Number of cache reads served from Redis',
    registers: [register],
});

const cacheMisses = new client.Counter({
    name: 'cache_misses_total',
    help: 'Number of cache reads that fell through to the database',
    registers: [register],
});

function metricsMiddleware(req, res, next) {
    // Skip the scrape endpoint itself to avoid self-referential noise.
    if (req.path === '/metrics') return next();

    const end = httpRequestDuration.startTimer();
    res.on('finish', () => {
        // Prefer the matched route pattern (e.g. /api/items/:id) over the raw
        // URL so label cardinality stays bounded.
        const route = req.route?.path
            ? (req.baseUrl || '') + req.route.path
            : req.path;
        end({
            method: req.method,
            route,
            status_code: res.statusCode,
        });
    });

    next();
}

module.exports = { register, metricsMiddleware, cacheHits, cacheMisses };
