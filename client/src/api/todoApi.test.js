import { describe, test, expect, vi, beforeEach } from 'vitest';
import { fetchItems, createItem, updateItem, deleteItem } from './todoApi';

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('fetchItems', () => {
    test('fetches and returns items on success', async () => {
        const items = [{ id: '1', name: 'Test', completed: false }];
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => items,
        }));

        const result = await fetchItems();
        expect(fetch).toHaveBeenCalledWith('/api/items', expect.objectContaining({ credentials: 'include' }));
        expect(result).toEqual(items);
    });

    test('throws when response is not ok', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
        await expect(fetchItems()).rejects.toThrow('Failed to fetch items');
    });
});

describe('createItem', () => {
    test('sends POST and returns created item', async () => {
        const item = { id: '1', name: 'Buy milk', completed: false };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => item,
        }));

        const result = await createItem('Buy milk');
        expect(fetch).toHaveBeenCalledWith('/api/items', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ name: 'Buy milk' }),
        }));
        expect(result).toEqual(item);
    });

    test('throws with server error message on failure', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Name is required' }),
        }));

        await expect(createItem('')).rejects.toThrow('Name is required');
    });
});

describe('updateItem', () => {
    test('sends PUT and returns updated item', async () => {
        const updated = { id: '1', name: 'Updated', completed: true };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => updated,
        }));

        const result = await updateItem('1', { name: 'Updated', completed: true });
        expect(fetch).toHaveBeenCalledWith('/api/items/1', expect.objectContaining({
            method: 'PUT',
        }));
        expect(result).toEqual(updated);
    });

    test('throws when response is not ok', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
        await expect(updateItem('1', {})).rejects.toThrow('Failed to update item');
    });
});

describe('deleteItem', () => {
    test('sends DELETE request', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

        await deleteItem('1');
        expect(fetch).toHaveBeenCalledWith('/api/items/1', expect.objectContaining({ method: 'DELETE', credentials: 'include' }));
    });

    test('throws when response is not ok', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
        await expect(deleteItem('1')).rejects.toThrow('Failed to delete item');
    });
});
