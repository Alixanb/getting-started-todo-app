const waitPort = require('wait-port');
const fs = require('fs');
const mysql = require('mysql2');
const { runMigrations } = require('../migrations/runner');

const {
    MYSQL_HOST: HOST,
    MYSQL_HOST_FILE: HOST_FILE,
    MYSQL_USER: USER,
    MYSQL_USER_FILE: USER_FILE,
    MYSQL_PASSWORD: PASSWORD,
    MYSQL_PASSWORD_FILE: PASSWORD_FILE,
    MYSQL_DB: DB,
    MYSQL_DB_FILE: DB_FILE,
} = process.env;

let pool;

function query(sql, params = []) {
    return new Promise((acc, rej) => {
        pool.query(sql, params, (err, rows) => (err ? rej(err) : acc(rows)));
    });
}

async function init() {
    const host = HOST_FILE ? fs.readFileSync(HOST_FILE) : HOST;
    const user = USER_FILE ? fs.readFileSync(USER_FILE) : USER;
    const password = PASSWORD_FILE ? fs.readFileSync(PASSWORD_FILE) : PASSWORD;
    const database = DB_FILE ? fs.readFileSync(DB_FILE) : DB;

    await waitPort({ host, port: 3306, timeout: 10000, waitForDns: true });

    pool = mysql.createPool({
        connectionLimit: 5,
        host,
        user,
        password,
        database,
        charset: 'utf8mb4',
    });

    await query('SELECT 1');
    console.log(`Connected to mysql db at host ${HOST}`);

    await runMigrations(
        (sql) => query(sql),
        (sql) => query(sql),
    );
}

async function teardown() {
    return new Promise((acc, rej) => {
        pool.end((err) => (err ? rej(err) : acc()));
    });
}

// ─── Todo items ──────────────────────────────────────────────────────────────

async function getItems(userId) {
    const rows = await query(
        'SELECT * FROM todo_items WHERE user_id = ?',
        [userId],
    );
    return rows.map((item) =>
        Object.assign({}, item, { completed: item.completed === 1 }),
    );
}

async function getItem(id) {
    const rows = await query('SELECT * FROM todo_items WHERE id = ?', [id]);
    const row = rows[0];
    if (!row) return undefined;
    return Object.assign({}, row, { completed: row.completed === 1 });
}

async function storeItem(item) {
    await query(
        'INSERT INTO todo_items (id, name, completed, user_id) VALUES (?, ?, ?, ?)',
        [item.id, item.name, item.completed ? 1 : 0, item.userId],
    );
}

async function updateItem(id, item) {
    await query(
        'UPDATE todo_items SET name=?, completed=? WHERE id=?',
        [item.name, item.completed ? 1 : 0, id],
    );
    return { id, name: item.name, completed: Boolean(item.completed) };
}

async function removeItem(id) {
    await query('DELETE FROM todo_items WHERE id = ?', [id]);
}

// ─── Users ───────────────────────────────────────────────────────────────────

async function getUserByEmail(email) {
    const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
}

async function getUserById(id) {
    const rows = await query(
        'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = ?',
        [id],
    );
    return rows[0];
}

async function createUser(user) {
    await query(
        'INSERT INTO users (id, email, first_name, last_name, password_hash) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.email, user.firstName, user.lastName, user.passwordHash],
    );
}

async function updateUser(id, { email, firstName, lastName }) {
    await query(
        'UPDATE users SET email = ?, first_name = ?, last_name = ? WHERE id = ?',
        [email, firstName, lastName, id],
    );
}

async function updateUserPassword(id, passwordHash) {
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [
        passwordHash,
        id,
    ]);
}

async function deleteUser(id) {
    await query('DELETE FROM users WHERE id = ?', [id]);
}

async function deleteUserItems(userId) {
    await query('DELETE FROM todo_items WHERE user_id = ?', [userId]);
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
