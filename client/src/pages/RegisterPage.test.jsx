import { test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';
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
            <RegisterPage />
        </MemoryRouter>,
    );
    const { container } = utils;
    // DOM order: firstName, lastName, email, password, confirm
    const allInputs = container.querySelectorAll('input');
    const passwordInputs = container.querySelectorAll('input[type="password"]');
    return {
        ...utils,
        firstName: allInputs[0],
        lastName: allInputs[1],
        email: container.querySelector('input[type="email"]'),
        password: passwordInputs[0],
        confirm: passwordInputs[1],
        submit: screen.getByRole('button', { name: /créer mon compte/i }),
    };
}

async function fill(fields, opts = {}) {
    await userEvent.type(fields.firstName, opts.first ?? 'Jane');
    await userEvent.type(fields.lastName, opts.last ?? 'Doe');
    await userEvent.type(fields.email, opts.email ?? 'a@b.com');
    await userEvent.type(fields.password, opts.pwd ?? 'password123');
    await userEvent.type(fields.confirm, opts.confirm ?? 'password123');
}

test('renders the registration form', () => {
    const { submit } = renderPage();
    expect(submit).toBeInTheDocument();
});

test('registers and navigates to login on success', async () => {
    authApi.register.mockResolvedValue({ id: '1' });
    const fields = renderPage();
    await fill(fields);
    await userEvent.click(fields.submit);

    await waitFor(() => expect(authApi.register).toHaveBeenCalledWith('a@b.com', 'Jane', 'Doe', 'password123'));
    expect(navigate).toHaveBeenCalledWith('/login');
});

test('blocks submission when passwords do not match', async () => {
    const fields = renderPage();
    await fill(fields, { confirm: 'different1' });
    await userEvent.click(fields.submit);

    expect(await screen.findByText(/ne correspondent pas/i)).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
});

test('surfaces a server error', async () => {
    authApi.register.mockRejectedValue(new Error('Email exists'));
    const fields = renderPage();
    await fill(fields);
    await userEvent.click(fields.submit);

    expect(await screen.findByText('Email exists')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
});
