/**
 * Integration tests for the full auth flow (register → login → me → update →
 * change password → delete). Needs a working SQLite binding; skipped otherwise.
 */
const path = require('path');
const os = require('os');
const fs = require('fs');

const DB_PATH = path.join(os.tmpdir(), `todo-auth-${process.pid}.db`);
process.env.SQLITE_DB_LOCATION = DB_PATH;
process.env.JWT_SECRET = 'auth-integration-secret';
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

const USER = {
    email: 'flow@test.com',
    password: 'Password123!',
    firstName: 'Flow',
    lastName: 'Tester',
};

beforeAll(async () => {
    if (sqlite3Available) await db.init();
});

afterAll(async () => {
    if (!sqlite3Available) return;
    await db.teardown();
    if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
});

describeIfSqlite('auth flow', () => {
    let cookie = '';

    test('registers a new user', async () => {
        const res = await request(app).post('/api/auth/register').send(USER);
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ email: USER.email, firstName: 'Flow' });
        expect(res.body).not.toHaveProperty('password_hash');
    });

    test('rejects a duplicate registration', async () => {
        const res = await request(app).post('/api/auth/register').send(USER);
        expect(res.status).toBe(400);
    });

    test('logs in and sets a cookie', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: USER.email, password: USER.password });
        expect(res.status).toBe(200);
        cookie = res.headers['set-cookie']?.[0] ?? '';
        expect(cookie).toContain('token=');
    });

    test('rejects login with a wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: USER.email, password: 'wrong' });
        expect(res.status).toBe(401);
    });

    test('blocks /api/auth/me without a cookie', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });

    test('returns the profile with a valid cookie', async () => {
        const res = await request(app).get('/api/auth/me').set('Cookie', cookie);
        expect(res.status).toBe(200);
        expect(res.body.email).toBe(USER.email);
    });

    test('updates the profile', async () => {
        const res = await request(app)
            .put('/api/auth/me')
            .set('Cookie', cookie)
            .send({ email: USER.email, firstName: 'Updated', lastName: 'Name' });
        expect(res.status).toBe(200);
        expect(res.body.firstName).toBe('Updated');
    });

    test('changes the password', async () => {
        const res = await request(app)
            .put('/api/auth/me/password')
            .set('Cookie', cookie)
            .send({ currentPassword: USER.password, newPassword: 'NewPassword123!' });
        expect(res.status).toBe(200);
    });

    test('deletes the account', async () => {
        const res = await request(app)
            .delete('/api/auth/me')
            .set('Cookie', cookie);
        expect(res.status).toBe(200);

        const login = await request(app)
            .post('/api/auth/login')
            .send({ email: USER.email, password: 'NewPassword123!' });
        expect(login.status).toBe(401);
    });
});
