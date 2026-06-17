/**
 * Database migration runner — compatible with both SQLite and MySQL adapters.
 *
 * How it works:
 *  1. Ensures a `_migrations` table exists to track applied migrations.
 *  2. Reads all *.sql files from this directory, sorted by filename.
 *  3. Applies any migration not yet recorded, in order.
 *
 * Each adapter must expose a `run(sql)` helper that executes a single statement.
 * The runner itself only uses that primitive, keeping it driver-agnostic.
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = __dirname;

/**
 * Run pending migrations.
 *
 * @param {Function} run - Executes a SQL string and returns a Promise.
 * @param {Function} all - Executes a SELECT and returns Promise<row[]>.
 */
async function runMigrations(run, all) {
    // Ensure the tracking table exists
    await run(`
        CREATE TABLE IF NOT EXISTS _migrations (
            name varchar(255) PRIMARY KEY,
            applied_at timestamp DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Collect already-applied migrations
    const applied = new Set(
        (await all('SELECT name FROM _migrations')).map((r) => r.name),
    );

    // Load and sort migration files
    const files = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();

    for (const file of files) {
        if (applied.has(file)) continue;

        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

        // Execute each statement in the file individually
        const statements = sql
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean);

        for (const stmt of statements) {
            await run(stmt);
        }

        await run(`INSERT INTO _migrations (name) VALUES ('${file}')`);

        if (process.env.NODE_ENV !== 'test') {
            console.log(`Migration applied: ${file}`);
        }
    }
}

module.exports = { runMigrations };
