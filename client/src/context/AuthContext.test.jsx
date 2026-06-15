import { test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import * as authApi from '../api/authApi';

vi.mock('../api/authApi');

beforeEach(() => {
    vi.restoreAllMocks();
});

// Small consumer that surfaces the auth state and actions for assertions.
function Consumer() {
    const { user, loginUser, logoutUser, updateUser } = useAuth();
    return (
        <div>
            <span data-testid="state">
                {user === null ? 'loading' : user === false ? 'anonymous' : user.email}
            </span>
            <button onClick={() => loginUser({ email: 'in@b.com' })}>login</button>
            <button onClick={logoutUser}>logout</button>
            <button onClick={() => updateUser({ firstName: 'X' })}>update</button>
        </div>
    );
}

test('restores the session from getMe on mount', async () => {
    authApi.getMe.mockResolvedValue({ email: 'restored@b.com' });
    render(
        <AuthProvider>
            <Consumer />
        </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('restored@b.com'));
});

test('falls back to anonymous when getMe fails', async () => {
    authApi.getMe.mockRejectedValue(new Error('401'));
    render(
        <AuthProvider>
            <Consumer />
        </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('anonymous'));
});

test('loginUser, logoutUser and updateUser mutate the state', async () => {
    authApi.getMe.mockRejectedValue(new Error('401'));
    render(
        <AuthProvider>
            <Consumer />
        </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('anonymous'));

    await userEvent.click(screen.getByText('login'));
    expect(screen.getByTestId('state')).toHaveTextContent('in@b.com');

    await userEvent.click(screen.getByText('update'));
    expect(screen.getByTestId('state')).toHaveTextContent('in@b.com');

    await userEvent.click(screen.getByText('logout'));
    expect(screen.getByTestId('state')).toHaveTextContent('anonymous');
});
