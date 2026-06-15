import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
    register,
    login,
    logout,
    getMe,
    updateMe,
    changePassword,
    deleteAccount,
} from './authApi';

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('register', () => {
    test('POSTs the registration payload with credentials', async () => {
        const user = { id: '1', email: 'a@b.com' };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => user }));

        const result = await register('a@b.com', 'Jane', 'Doe', 'password123');

        expect(fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({ email: 'a@b.com', firstName: 'Jane', lastName: 'Doe', password: 'password123' }),
        }));
        expect(result).toEqual(user);
    });

    test('throws the server error message on failure', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Email exists' }) }));
        await expect(register('a@b.com', 'Jane', 'Doe', 'password123')).rejects.toThrow('Email exists');
    });
});

describe('login', () => {
    test('POSTs credentials and returns the user', async () => {
        const user = { id: '1', email: 'a@b.com' };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => user }));

        const result = await login('a@b.com', 'password123');

        expect(fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
            method: 'POST',
            credentials: 'include',
        }));
        expect(result).toEqual(user);
    });

    test('throws a generic message when no error body is provided', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
        await expect(login('a@b.com', 'bad')).rejects.toThrow('Request failed');
    });
});

describe('logout', () => {
    test('POSTs to the logout endpoint with credentials', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
        await logout();
        expect(fetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({
            method: 'POST',
            credentials: 'include',
        }));
    });
});

describe('getMe', () => {
    test('GETs the profile with credentials', async () => {
        const user = { id: '1' };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => user }));
        const result = await getMe();
        expect(fetch).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({ credentials: 'include' }));
        expect(result).toEqual(user);
    });

    test('throws when unauthenticated', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
        await expect(getMe()).rejects.toThrow();
    });
});

describe('updateMe', () => {
    test('PUTs the updated profile', async () => {
        const updated = { id: '1', firstName: 'Jane' };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => updated }));
        const result = await updateMe({ firstName: 'Jane' });
        expect(fetch).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({ method: 'PUT', credentials: 'include' }));
        expect(result).toEqual(updated);
    });
});

describe('changePassword', () => {
    test('PUTs to the password endpoint', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'ok' }) }));
        await changePassword('old', 'newpass12');
        expect(fetch).toHaveBeenCalledWith('/api/auth/me/password', expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ currentPassword: 'old', newPassword: 'newpass12' }),
        }));
    });
});

describe('deleteAccount', () => {
    test('DELETEs the account', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: 'deleted' }) }));
        await deleteAccount();
        expect(fetch).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({ method: 'DELETE', credentials: 'include' }));
    });
});
