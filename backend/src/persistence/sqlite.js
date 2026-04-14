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

async function deleteUserItems(userId) {
    await run('DELETE FROM todo_items WHERE user_id = ?', [userId]);
}

module.exports = {
    init,
    teardown,
    // items
    getItems,
    getItem,
    storeItem,
    updateItem,
    removeItem,
    // users
    getUserByEmail,
    getUserById,
    createUser,
    updateUser,
    updateUserPassword,
    deleteUser,
    deleteUserItems,
};
