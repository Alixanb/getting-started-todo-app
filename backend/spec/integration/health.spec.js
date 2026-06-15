/**
 * Integration tests for the observability endpoints.
 * Like items.spec.js, these need a working SQLite binding (the readiness
 * probe pings the DB) and are skipped when it is unavailable.
 */
const path = require('path');
const os = require('os');
const fs = require('fs');

const DB_PATH = path.join(os.tmpdir(), `todo-health-${process.pid}.db`);
process.env.SQLITE_DB_LOCATION = DB_PATH;
process.env.JWT_SECRET = 'health-test-secret';
delete process.env.MYSQL_HOST;

let db, createApp, request, sqlite3Available;

try {
    db = require('../../src/persistence');
    ({ createApp } = require('../../src/app'));
    request = require('supertest');
    sqlite3Available = true;
} catch {
    sqlite3Available = false;
}

const describeIfSqlite = sqlite3Available ? describe : describe.skip;
const app = sqlite3Available ? createApp() : null;

beforeAll(async () => {
    if (sqlite3Available) await db.init();
});

afterAll(async () => {
    if (!sqlite3Available) return;
    await db.teardown();
    if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
});

describeIfSqlite('observability endpoints', () => {
    test('GET /health returns 200 ok', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'ok' });
    });

    test('GET /ready returns 200 when the DB is reachable', async () => {
        const res = await request(app).get('/ready');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'ready' });
    });

    test('GET /metrics exposes Prometheus metrics', async () => {
        const res = await request(app).get('/metrics');
        expect(res.status).toBe(200);
        expect(res.text).toContain('http_request_duration_seconds');
        expect(res.text).toContain('process_cpu_seconds_total');
    });
});
