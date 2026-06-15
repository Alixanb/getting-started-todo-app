import { test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ChangePasswordPage } from './ChangePasswordPage';
import * as authApi from '../api/authApi';

const navigate = vi.fn();

vi.mock('../api/authApi');
vi.mock('react-router-dom', async (importOriginal) => ({
    ...(await importOriginal()),
    useNavigate: () => navigate,
}));

beforeEach(() => {
    vi.clearAllMocks();
});

function renderPage() {
    const utils = render(
        <MemoryRouter>
            <ChangePasswordPage />
        </MemoryRouter>,
    );
    const pw = utils.container.querySelectorAll('input[type="password"]');
    return {
        ...utils,
        current: pw[0],
        next: pw[1],
        confirm: pw[2],
        submit: screen.getByRole('button', { name: /modifier le mot de passe/i }),
    };
}

test('changes the password and redirects to the profile', async () => {
    authApi.changePassword.mockResolvedValue({ message: 'ok' });
    const { current, next, confirm, submit } = renderPage();

    await userEvent.type(current, 'oldpass12');
    await userEvent.type(next, 'newpass12');
    await userEvent.type(confirm, 'newpass12');
    await userEvent.click(submit);

    await waitFor(() => expect(authApi.changePassword).toHaveBeenCalledWith('oldpass12', 'newpass12'));
    expect(navigate).toHaveBeenCalledWith('/profile', expect.objectContaining({
        state: expect.objectContaining({ success: expect.any(String) }),
    }));
});

test('blocks when the new passwords do not match', async () => {
    const { current, next, confirm, submit } = renderPage();
    await userEvent.type(current, 'oldpass12');
    await userEvent.type(next, 'newpass12');
    await userEvent.type(confirm, 'different12');
    await userEvent.click(submit);

    expect(await screen.findByText(/ne correspondent pas/i)).toBeInTheDocument();
    expect(authApi.changePassword).not.toHaveBeenCalled();
});

test('surfaces a server error', async () => {
    authApi.changePassword.mockRejectedValue(new Error('Current password is incorrect'));
    const { current, next, confirm, submit } = renderPage();
    await userEvent.type(current, 'wrongpass');
    await userEvent.type(next, 'newpass12');
    await userEvent.type(confirm, 'newpass12');
    await userEvent.click(submit);

    expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument();
});
