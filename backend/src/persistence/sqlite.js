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

// ─── Todo items ──────────────────────────────────────────────────────────────

async function getItems(userId) {
    const rows = await all(
        'SELECT * FROM todo_items WHERE user_id = ?',
        [userId],
    );
    return rows.map((item) =>
        Object.assign({}, item, { completed: item.completed === 1 }),
    );
}

async function getItem(id) {
    const row = await get('SELECT * FROM todo_items WHERE id = ?', [id]);
    if (!row) return undefined;
    return Object.assign({}, row, { completed: row.completed === 1 });
}

async function storeItem(item) {
    await run(
        'INSERT INTO todo_items (id, name, completed, user_id) VALUES (?, ?, ?, ?)',
        [item.id, item.name, item.completed ? 1 : 0, item.userId],
    );
}

async function updateItem(id, item) {
    await run(
        'UPDATE todo_items SET name=?, completed=? WHERE id = ?',
        [item.name, item.completed ? 1 : 0, id],
    );
    return { id, name: item.name, completed: Boolean(item.completed) };
}

async function removeItem(id) {
    await run('DELETE FROM todo_items WHERE id = ?', [id]);
}

// Purge all items of a user — called by the Kafka consumer on `user.deleted`,
// since the auth service no longer reaches this database directly.
async function deleteUserItems(userId) {
    await run('DELETE FROM todo_items WHERE user_id = ?', [userId]);
}

module.exports = {
    init,
    teardown,
    ping,
    getItems,
    getItem,
    storeItem,
    updateItem,
    removeItem,
    deleteUserItems,
};
