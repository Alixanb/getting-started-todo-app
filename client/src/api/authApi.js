const BASE = '/api/auth';

async function handleResponse(res) {
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'Request failed');
    return body;
}

export async function register(email, firstName, lastName, password) {
    const res = await fetch(`${BASE}/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName, password }),
    });
    return handleResponse(res);
}

export async function login(email, password) {
    const res = await fetch(`${BASE}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
}

export async function logout() {
    await fetch(`${BASE}/logout`, { method: 'POST', credentials: 'include' });
}

export async function getMe() {
    const res = await fetch(`${BASE}/me`, { credentials: 'include' });
    return handleResponse(res);
}

export async function updateMe(data) {
    const res = await fetch(`${BASE}/me`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}

export async function changePassword(currentPassword, newPassword) {
    const res = await fetch(`${BASE}/me/password`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(res);
}

export async function deleteAccount() {
    const res = await fetch(`${BASE}/me`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return handleResponse(res);
}
