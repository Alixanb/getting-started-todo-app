const db = require('../../src/persistence');
const itemService = require('../../src/services/itemService');

jest.mock('../../src/persistence', () => ({
    getItems: jest.fn(),
    storeItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
}));

beforeEach(() => {
    jest.clearAllMocks();
});

describe('getItems', () => {
    test('delegates to db.getItems with userId', async () => {
        const items = [{ id: '1', name: 'Test', completed: false }];
        db.getItems.mockResolvedValue(items);

        const result = await itemService.getItems('user-1');

        expect(db.getItems).toHaveBeenCalledWith('user-1');
        expect(result).toEqual(items);
    });
});

describe('addItem', () => {
    test('stores and returns a new item with correct shape', async () => {
        db.storeItem.mockResolvedValue();

        const result = await itemService.addItem('Buy milk', 'user-1');

        expect(db.storeItem).toHaveBeenCalledTimes(1);
        const stored = db.storeItem.mock.calls[0][0];
        expect(stored).toMatchObject({ name: 'Buy milk', completed: false, userId: 'user-1' });
        expect(typeof stored.id).toBe('string');
        expect(result).toEqual(stored);
    });

    test('trims whitespace from name', async () => {
        db.storeItem.mockResolvedValue();

        const result = await itemService.addItem('  Buy milk  ', 'user-1');

        expect(result.name).toBe('Buy milk');
    });

    test('throws 400 when name is empty', async () => {
        await expect(itemService.addItem('')).rejects.toMatchObject({
            status: 400,
            message: 'Name is required',
        });
        expect(db.storeItem).not.toHaveBeenCalled();
    });

    test('throws 400 when name is only whitespace', async () => {
        await expect(itemService.addItem('   ')).rejects.toMatchObject({
            status: 400,
        });
        expect(db.storeItem).not.toHaveBeenCalled();
    });

    test('throws 400 when name exceeds 255 characters', async () => {
        await expect(itemService.addItem('a'.repeat(256))).rejects.toMatchObject({
            status: 400,
            message: 'Name must be 255 characters or fewer',
        });
        expect(db.storeItem).not.toHaveBeenCalled();
    });

    test('throws 400 when name is missing', async () => {
        await expect(itemService.addItem(undefined)).rejects.toMatchObject({
            status: 400,
        });
    });
});

describe('updateItem', () => {
    test('delegates to db.updateItem and returns the result', async () => {
        const updated = { id: '1', name: 'Updated', completed: true };
        db.updateItem.mockResolvedValue(updated);

        const result = await itemService.updateItem('1', { name: 'Updated', completed: true });

        expect(db.updateItem).toHaveBeenCalledWith('1', { name: 'Updated', completed: true });
        expect(result).toEqual(updated);
    });
});

describe('deleteItem', () => {
    test('delegates to db.removeItem', async () => {
        db.removeItem.mockResolvedValue();

        await itemService.deleteItem('1');

        expect(db.removeItem).toHaveBeenCalledWith('1');
    });
});
