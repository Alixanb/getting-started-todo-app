import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTodoList } from './useTodoList';
import * as todoApi from '../api/todoApi';

vi.mock('../api/todoApi');

const ITEMS = [
    { id: '1', name: 'Item One', completed: false },
    { id: '2', name: 'Item Two', completed: true },
];

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('useTodoList', () => {
    test('loads items on mount', async () => {
        todoApi.fetchItems.mockResolvedValue(ITEMS);

        const { result } = renderHook(() => useTodoList());

        await waitFor(() => expect(result.current.items).not.toBeNull());
        expect(result.current.items).toEqual(ITEMS);
        expect(result.current.error).toBeNull();
    });

    test('sets error when fetch fails', async () => {
        const err = new Error('network error');
        todoApi.fetchItems.mockRejectedValue(err);

        const { result } = renderHook(() => useTodoList());

        await waitFor(() => expect(result.current.error).not.toBeNull());
        expect(result.current.error).toBe(err);
        expect(result.current.items).toBeNull();
    });

    test('onNewItem appends item to list', async () => {
        todoApi.fetchItems.mockResolvedValue(ITEMS);
        const { result } = renderHook(() => useTodoList());
        await waitFor(() => expect(result.current.items).not.toBeNull());

        const newItem = { id: '3', name: 'Item Three', completed: false };
        act(() => result.current.onNewItem(newItem));

        expect(result.current.items).toHaveLength(3);
        expect(result.current.items[2]).toEqual(newItem);
    });

    test('onItemUpdate replaces the matching item', async () => {
        todoApi.fetchItems.mockResolvedValue(ITEMS);
        const { result } = renderHook(() => useTodoList());
        await waitFor(() => expect(result.current.items).not.toBeNull());

        const updated = { id: '1', name: 'Item One Updated', completed: true };
        act(() => result.current.onItemUpdate(updated));

        expect(result.current.items[0]).toEqual(updated);
        expect(result.current.items[1]).toEqual(ITEMS[1]);
    });

    test('onItemRemoval removes the matching item', async () => {
        todoApi.fetchItems.mockResolvedValue(ITEMS);
        const { result } = renderHook(() => useTodoList());
        await waitFor(() => expect(result.current.items).not.toBeNull());

        act(() => result.current.onItemRemoval(ITEMS[0]));

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0]).toEqual(ITEMS[1]);
    });
});
