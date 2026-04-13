const { v4: uuid } = require('uuid');
const db = require('../persistence');

async function getItems(userId) {
    return db.getItems(userId);
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
    return item;
}

async function updateItem(id, { name, completed }) {
    return db.updateItem(id, { name, completed });
}

async function deleteItem(id) {
    return db.removeItem(id);
}

module.exports = { getItems, addItem, updateItem, deleteItem };
