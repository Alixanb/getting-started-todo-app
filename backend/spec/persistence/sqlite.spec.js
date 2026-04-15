/**
 * Persistence tests — requires a working SQLite binding.
 * Skipped automatically when the native sqlite3 binary is unavailable
 * (e.g. Node v24 on macOS ARM64 outside Docker).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const DB_PATH = path.join(os.tmpdir(), `todo-sqlite-${process.pid}.db`);
process.env.SQLITE_DB_LOCATION = DB_PATH;

let db;
let sqlite3Available;

try {
    db = require('../../src/persistence/sqlite');
    sqlite3Available = true;
} catch {
    sqlite3Available = false;
}

const describeIfSqlite = sqlite3Available ? describe : describe.skip;

const USER_ID = 'user-test-1';

const ITEM = {
    id: '7aef3d7c-d301-4846-8358-2a91ec9d6be3',
    name: 'Test',
    completed: false,
    userId: USER_ID,
};

describeIfSqlite('SQLite persistence', () => {
    beforeEach(async () => {
        if (fs.existsSync(DB_PATH)) {
            fs.unlinkSync(DB_PATH);
        }
        await db.init();
    });

    test('it initializes correctly', async () => {
        // init() already called in beforeEach — just verify no error thrown
    });

    test('it can store and retrieve items', async () => {
        await db.storeItem(ITEM);

        const items = await db.getItems(USER_ID);
        expect(items.length).toBe(1);
        expect(items[0]).toMatchObject({ id: ITEM.id, name: ITEM.name, completed: ITEM.completed });
    });

    test('it can update an existing item', async () => {
        const initialItems = await db.getItems(USER_ID);
        expect(initialItems.length).toBe(0);

        await db.storeItem(ITEM);

        await db.updateItem(ITEM.id, { ...ITEM, completed: !ITEM.completed });

        const items = await db.getItems(USER_ID);
        expect(items.length).toBe(1);
        expect(items[0].completed).toBe(!ITEM.completed);
    });

    test('it can remove an existing item', async () => {
        await db.storeItem(ITEM);

        await db.removeItem(ITEM.id);

        const items = await db.getItems(USER_ID);
        expect(items.length).toBe(0);
    });

    test('it can get a single item', async () => {
        await db.storeItem(ITEM);

        const item = await db.getItem(ITEM.id);
        expect(item).toMatchObject({ id: ITEM.id, name: ITEM.name, completed: ITEM.completed });
    });
});
