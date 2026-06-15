import { test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import * as authApi from '../api/authApi';
import * as AuthContext from '../context/AuthContext';

const navigate = vi.fn();

vi.mock('../api/authApi');
vi.mock('../context/AuthContext');
vi.mock('react-router-dom', async (importOriginal) => ({
    ...(await importOriginal()),
    useNavigate: () => navigate,
}));

beforeEach(() => {
    vi.clearAllMocks();
    AuthContext.useAuth.mockReturnValue({ loginUser: vi.fn() });
});

function renderPage() {
    const utils = render(
        <MemoryRouter>
            <LoginPage />
        </MemoryRouter>,
    );
    const { container } = utils;
    return {
        ...utils,
        email: container.querySelector('input[type="email"]'),
        password: container.querySelector('input[type="password"]'),
        submit: screen.getByRole('button', { name: /se connecter/i }),
    };
}

test('renders the login form', () => {
    const { email, password, submit } = renderPage();
    expect(email).toBeInTheDocument();
    expect(password).toBeInTheDocument();
    expect(submit).toBeInTheDocument();
});

test('logs in and navigates home on success', async () => {
    const loginUser = vi.fn();
    AuthContext.useAuth.mockReturnValue({ loginUser });
    authApi.login.mockResolvedValue({ id: '1', email: 'a@b.com' });

    const { email, password, submit } = renderPage();
    await userEvent.type(email, 'a@b.com');
    await userEvent.type(password, 'password123');
    await userEvent.click(submit);

    await waitFor(() => expect(authApi.login).toHaveBeenCalledWith('a@b.com', 'password123'));
    expect(loginUser).toHaveBeenCalledWith({ id: '1', email: 'a@b.com' });
    expect(navigate).toHaveBeenCalledWith('/');
});

test('shows an error message when login fails', async () => {
    authApi.login.mockRejectedValue(new Error('Invalid credentials'));

    const { email, password, submit } = renderPage();
    await userEvent.type(email, 'a@b.com');
    await userEvent.type(password, 'wrong123');
    await userEvent.click(submit);

    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument());
    expect(navigate).not.toHaveBeenCalled();
});
