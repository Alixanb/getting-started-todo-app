import { test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import * as AuthContext from '../context/AuthContext';

vi.mock('../context/AuthContext');

beforeEach(() => {
    vi.restoreAllMocks();
});

function renderAt(initial = '/') {
    return render(
        <MemoryRouter initialEntries={[initial]}>
            <Routes>
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <div>Secret</div>
                        </ProtectedRoute>
                    }
                />
                <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
        </MemoryRouter>,
    );
}

test('renders nothing while the session is loading', () => {
    AuthContext.useAuth.mockReturnValue({ user: null });
    const { container } = renderAt();
    expect(container.textContent).toBe('');
});

test('redirects to /login when not authenticated', () => {
    AuthContext.useAuth.mockReturnValue({ user: false });
    renderAt();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
});

test('renders children when authenticated', () => {
    AuthContext.useAuth.mockReturnValue({ user: { email: 'a@b.com' } });
    renderAt();
    expect(screen.getByText('Secret')).toBeInTheDocument();
});
