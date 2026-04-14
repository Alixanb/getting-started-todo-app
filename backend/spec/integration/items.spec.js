/**
 * Integration tests — requires a working SQLite binding.
 * Runs automatically in CI (Docker with matching Node ABI).
 * Skipped locally when the native sqlite3 binary is unavailable.
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

// Use a temp SQLite file so each run gets a clean state
const DB_PATH = path.join(os.tmpdir(), `todo-integration-${process.pid}.db`);
process.env.SQLITE_DB_LOCATION = DB_PATH;
delete process.env.MYSQL_HOST;

let db, createApp, sqlite3Available;

try {
    db = require('../../src/persistence');
    ({ createApp } = require('../../src/app'));
    sqlite3Available = true;
} catch {
    sqlite3Available = false;
}

const describeIfSqlite = sqlite3Available ? describe : describe.skip;

const app = sqlite3Available ? createApp() : null;

beforeAll(async () => {
    if (!sqlite3Available) return;
    await db.init();
});

afterAll(async () => {
    if (!sqlite3Available) return;
    await db.teardown();
    if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
});

beforeEach(async () => {
    if (!sqlite3Available) return;
    // Clear items before each test for isolation
    const items = await db.getItems();
    await Promise.all(items.map((i) => db.removeItem(i.id)));
});

// ─── GET /api/items ──────────────────────────────────────────────────────────

describeIfSqlite('GET /api/items', () => {
    const request = require('supertest');

    test('returns 200 with empty array when no items', async () => {
        const res = await request(app).get('/api/items');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('returns existing items', async () => {
        await request(app).post('/api/items').send({ name: 'Buy milk' });

        const res = await request(app).get('/api/items');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0]).toMatchObject({ name: 'Buy milk', completed: false });
    });
});

// ─── POST /api/items ─────────────────────────────────────────────────────────

describeIfSqlite('POST /api/items', () => {
    const request = require('supertest');

    test('creates an item and returns 201', async () => {
        const res = await request(app)
            .post('/api/items')
            .send({ name: 'Walk the dog' });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ name: 'Walk the dog', completed: false });
        expect(typeof res.body.id).toBe('string');
    });

    test('trims whitespace from name', async () => {
        const res = await request(app)
            .post('/api/items')
            .send({ name: '  Trimmed  ' });

        expect(res.status).toBe(201);
        expect(res.body.name).toBe('Trimmed');
    });

    test('returns 400 when name is empty', async () => {
        const res = await request(app).post('/api/items').send({ name: '' });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when name is only whitespace', async () => {
        const res = await request(app).post('/api/items').send({ name: '   ' });
        expect(res.status).toBe(400);
    });

    test('returns 400 when name exceeds 255 characters', async () => {
        const res = await request(app)
            .post('/api/items')
            .send({ name: 'a'.repeat(256) });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('returns 400 when name is missing', async () => {
        const res = await request(app).post('/api/items').send({});
        expect(res.status).toBe(400);
    });
});

// ─── PUT /api/items/:id ──────────────────────────────────────────────────────

describeIfSqlite('PUT /api/items/:id', () => {
    const request = require('supertest');

    test('updates an item and returns it', async () => {
        const created = await request(app)
            .post('/api/items')
            .send({ name: 'Original' });
        const id = created.body.id;

        const res = await request(app)
            .put(`/api/items/${id}`)
            .send({ name: 'Updated', completed: true });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id, name: 'Updated', completed: true });
    });
});

// ─── DELETE /api/items/:id ───────────────────────────────────────────────────

describeIfSqlite('DELETE /api/items/:id', () => {
    const request = require('supertest');

    test('deletes an item and returns 200', async () => {
        const created = await request(app)
            .post('/api/items')
            .send({ name: 'To delete' });
        const id = created.body.id;

        const res = await request(app).delete(`/api/items/${id}`);
        expect(res.status).toBe(200);

        const list = await request(app).get('/api/items');
        expect(list.body).toHaveLength(0);
    });
});
