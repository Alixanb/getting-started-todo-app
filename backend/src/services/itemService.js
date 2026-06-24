const { v4: uuid } = require('uuid');
const db = require('../persistence');
const cache = require('../cache');

const itemsKey = (userId) => `items:${userId}`;

async function getItems(userId) {
    const cached = await cache.get(itemsKey(userId));
    if (cached) return cached;

    const items = await db.getItems(userId);
    await cache.set(itemsKey(userId), items);
    return items;
}

async function addItem(name, userId) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        const err = new Error('Name is required');
        err.status = 400;
        throw err;
    }
    const trimmed = name.trim();
    if (trimmed.length > 255) {
        const err = new Error('Name must be 255 characters or fewer');
        err.status = 400;
        throw err;
    }

    const item = { id: uuid(), name: trimmed, completed: false, userId };
    await db.storeItem(item);
    await cache.del(itemsKey(userId));
    return item;
}

async function updateItem(id, { name, completed }, userId) {
    const result = await db.updateItem(id, { name, completed });
    await cache.del(itemsKey(userId));
    return result;
}

async function deleteItem(id, userId) {
    await db.removeItem(id);
    await cache.del(itemsKey(userId));
}

module.exports = { getItems, addItem, updateItem, deleteItem };
