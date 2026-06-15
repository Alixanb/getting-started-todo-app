import { test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from './ProfilePage';
import * as authApi from '../api/authApi';
import * as AuthContext from '../context/AuthContext';

const navigate = vi.fn();

vi.mock('../api/authApi');
vi.mock('../context/AuthContext');
vi.mock('react-router-dom', async (importOriginal) => ({
    ...(await importOriginal()),
    useNavigate: () => navigate,
}));

const baseUser = { firstName: 'Jane', lastName: 'Doe', email: 'jane@b.com' };

let updateUser, logoutUser;

beforeEach(() => {
    vi.clearAllMocks();
    updateUser = vi.fn();
    logoutUser = vi.fn();
    AuthContext.useAuth.mockReturnValue({ user: baseUser, updateUser, logoutUser });
});

function renderPage() {
    return render(
        <MemoryRouter>
            <ProfilePage />
        </MemoryRouter>,
    );
}

test('prefills the form with the current user', () => {
    const { container } = renderPage();
    expect(container.querySelector('input[type="email"]').value).toBe('jane@b.com');
});

test('saves the profile and shows a success message', async () => {
    authApi.updateMe.mockResolvedValue({ ...baseUser, firstName: 'Janet' });
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => expect(authApi.updateMe).toHaveBeenCalled());
    expect(updateUser).toHaveBeenCalled();
    expect(await screen.findByText(/mis à jour avec succès/i)).toBeInTheDocument();
});

test('shows an error when saving fails', async () => {
    authApi.updateMe.mockRejectedValue(new Error('Email already used'));
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

    expect(await screen.findByText('Email already used')).toBeInTheDocument();
});

test('logs out from the profile', async () => {
    authApi.logout.mockResolvedValue();
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /se déconnecter/i }));

    await waitFor(() => expect(logoutUser).toHaveBeenCalled());
    expect(navigate).toHaveBeenCalledWith('/login');
});

test('deletes the account through the confirmation modal', async () => {
    authApi.deleteAccount.mockResolvedValue();
    authApi.logout.mockResolvedValue();
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /supprimer mon compte/i }));
    // Modal confirm button
    const confirm = await screen.findByRole('button', { name: /oui, supprimer/i });
    await userEvent.click(confirm);

    await waitFor(() => expect(authApi.deleteAccount).toHaveBeenCalled());
    expect(logoutUser).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/login');
});
