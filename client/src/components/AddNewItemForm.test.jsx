import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddItemForm } from './AddNewItemForm';
import * as todoApi from '../api/todoApi';

vi.mock('../api/todoApi');

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('AddItemForm', () => {
    test('renders input and button', () => {
        render(<AddItemForm onNewItem={() => {}} />);
        expect(screen.getByPlaceholderText('New Item')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
    });

    test('button is disabled when input is empty', () => {
        render(<AddItemForm onNewItem={() => {}} />);
        expect(screen.getByRole('button', { name: /add item/i })).toBeDisabled();
    });

    test('calls onNewItem and clears input on successful submission', async () => {
        const newItem = { id: '1', name: 'Buy milk', completed: false };
        todoApi.createItem.mockResolvedValue(newItem);
        const onNewItem = vi.fn();

        render(<AddItemForm onNewItem={onNewItem} />);

        const input = screen.getByPlaceholderText('New Item');
        await userEvent.type(input, 'Buy milk');
        await userEvent.click(screen.getByRole('button', { name: /add item/i }));

        await waitFor(() => expect(onNewItem).toHaveBeenCalledWith(newItem));
        expect(input.value).toBe('');
    });

    test('shows error message on API failure', async () => {
        todoApi.createItem.mockRejectedValue(new Error('Name is required'));

        render(<AddItemForm onNewItem={() => {}} />);

        await userEvent.type(screen.getByPlaceholderText('New Item'), 'x');
        await userEvent.click(screen.getByRole('button', { name: /add item/i }));

        await waitFor(() =>
            expect(screen.getByText('Name is required')).toBeInTheDocument(),
        );
    });

    test('input has maxLength of 255', () => {
        render(<AddItemForm onNewItem={() => {}} />);
        const input = screen.getByPlaceholderText('New Item');
        expect(input).toHaveAttribute('maxlength', '255');
    });
});
