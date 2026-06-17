const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const { runMigrations } = require('../migrations/runner');
const location = process.env.SQLITE_DB_LOCATION || '/etc/todos/todo.db';

let db;

function run(sql, params = []) {
    return new Promise((acc, rej) => {
        db.run(sql, params, (err) => (err ? rej(err) : acc()));
    });
}

function all(sql, params = []) {
    return new Promise((acc, rej) => {
        db.all(sql, params, (err, rows) => (err ? rej(err) : acc(rows)));
    });
}

function get(sql, params = []) {
    return new Promise((acc, rej) => {
        db.get(sql, params, (err, row) => (err ? rej(err) : acc(row)));
    });
}

async function init() {
    const dirName = require('path').dirname(location);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    await new Promise((acc, rej) => {
        db = new sqlite3.Database(location, (err) => {
            if (err) return rej(err);
            if (process.env.NODE_ENV !== 'test')
                console.log(`Using sqlite database at ${location}`);
            acc();
        });
    });

    await runMigrations(
        (sql) => run(sql),
        (sql) => all(sql),
    );
}

async function teardown() {
    return new Promise((acc, rej) => {
        db.close((err) => {
            if (err) rej(err);
            else acc();
        });
    });
}

// Lightweight connectivity check used by the readiness probe.
async function ping() {
    await get('SELECT 1');
    return true;
}

// ─── Users ───────────────────────────────────────────────────────────────────

async function getUserByEmail(email) {
    return get('SELECT * FROM users WHERE email = ?', [email]);
}

async function getUserById(id) {
    return get(
        'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = ?',
        [id],
    );
}

async function createUser(user) {
    await run(
        'INSERT INTO users (id, email, first_name, last_name, password_hash) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.email, user.firstName, user.lastName, user.passwordHash],
    );
}

async function updateUser(id, { email, firstName, lastName }) {
    await run(
        'UPDATE users SET email = ?, first_name = ?, last_name = ? WHERE id = ?',
        [email, firstName, lastName, id],
    );
}

async function updateUserPassword(id, passwordHash) {
    await run('UPDATE users SET password_hash = ? WHERE id = ?', [
        passwordHash,
        id,
    ]);
}

async function deleteUser(id) {
    await run('DELETE FROM users WHERE id = ?', [id]);
}

// Cascade cleanup of the user's todo items on account deletion. The auth and
// backend services share the same database, so the auth service removes the
// rows tied to the account it deletes. The todo_items table is owned by the
// backend service; if it doesn't exist yet, there is nothing to clean up.
async function deleteUserItems(userId) {
    try {
        await run('DELETE FROM todo_items WHERE user_id = ?', [userId]);
    } catch (err) {
        if (!/no such table/.test(err.message)) throw err;
    }
}

module.exports = {
    init,
    teardown,
    ping,
    getUserByEmail,
    getUserById,
    createUser,
    updateUser,
    updateUserPassword,
    deleteUser,
    deleteUserItems,
};
