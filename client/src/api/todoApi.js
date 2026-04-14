const BASE = '/api/items';

export async function fetchItems() {
    const res = await fetch(BASE, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch items');
    return res.json();
}

export async function createItem(name) {
    const res = await fetch(BASE, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ name }),
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create item');
    }
    return res.json();
}

export async function updateItem(id, data) {
    const res = await fetch(`${BASE}/${id}`, {
        method: 'PUT',
        credentials: 'include',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to update item');
    return res.json();
}

export async function deleteItem(id) {
    const res = await fetch(`${BASE}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete item');
}
