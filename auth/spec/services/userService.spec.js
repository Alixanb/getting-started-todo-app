/**
 * Unit tests for the user service.
 * Persistence, bcrypt and jwt are mocked so the suite runs without a native
 * sqlite binding and stays fast/deterministic.
 */
process.env.JWT_SECRET = 'test-secret';

jest.mock('../../src/persistence', () => ({
    getUserByEmail: jest.fn(),
    getUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    updateUserPassword: jest.fn(),
    deleteUser: jest.fn(),
}));
jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));
jest.mock('../../src/bus', () => ({ publish: jest.fn() }));

const db = require('../../src/persistence');
const bcrypt = require('bcryptjs');
const bus = require('../../src/bus');
const userService = require('../../src/services/userService');

beforeEach(() => jest.clearAllMocks());

describe('register', () => {
    test('creates a user and returns it without the hash', async () => {
        db.getUserByEmail.mockResolvedValue(undefined);
        bcrypt.hash.mockResolvedValue('hashed');
        db.createUser.mockResolvedValue();

        const user = await userService.register(
            'New@Example.com',
            'Jane',
            'Doe',
            'password123',
        );

        expect(user).toMatchObject({
            email: 'new@example.com',
            firstName: 'Jane',
            lastName: 'Doe',
        });
        expect(user).not.toHaveProperty('passwordHash');
        expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
        expect(db.createUser).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'new@example.com', passwordHash: 'hashed' }),
        );
    });

    test.each([
        ['bad email', 'not-an-email', 'Jane', 'Doe', 'password123'],
        ['empty first name', 'a@b.com', '', 'Doe', 'password123'],
        ['empty last name', 'a@b.com', 'Jane', '', 'password123'],
        ['short password', 'a@b.com', 'Jane', 'Doe', 'short'],
    ])('rejects %s with 400', async (_label, email, first, last, pwd) => {
        await expect(
            userService.register(email, first, last, pwd),
        ).rejects.toMatchObject({ status: 400 });
    });

    test('rejects a duplicate email with 400', async () => {
        db.getUserByEmail.mockResolvedValue({ id: 'existing' });
        await expect(
            userService.register('a@b.com', 'Jane', 'Doe', 'password123'),
        ).rejects.toMatchObject({ status: 400 });
        expect(db.createUser).not.toHaveBeenCalled();
    });
});

describe('login', () => {
    const dbUser = {
        id: 'u1',
        email: 'a@b.com',
        first_name: 'Jane',
        last_name: 'Doe',
        password_hash: 'hashed',
    };

    test('returns a token and user on success', async () => {
        db.getUserByEmail.mockResolvedValue(dbUser);
        bcrypt.compare.mockResolvedValue(true);

        const result = await userService.login('A@B.com', 'password123');

        expect(typeof result.token).toBe('string');
        expect(result.user).toEqual({
            id: 'u1',
            email: 'a@b.com',
            firstName: 'Jane',
            lastName: 'Doe',
        });
    });

    test('rejects missing credentials with 401', async () => {
        await expect(userService.login('', '')).rejects.toMatchObject({ status: 401 });
    });

    test('rejects unknown user with 401', async () => {
        db.getUserByEmail.mockResolvedValue(undefined);
        await expect(
            userService.login('a@b.com', 'password123'),
        ).rejects.toMatchObject({ status: 401 });
    });

    test('rejects wrong password with 401', async () => {
        db.getUserByEmail.mockResolvedValue(dbUser);
        bcrypt.compare.mockResolvedValue(false);
        await expect(
            userService.login('a@b.com', 'wrong'),
        ).rejects.toMatchObject({ status: 401 });
    });
});

describe('getProfile', () => {
    test('returns the profile', async () => {
        db.getUserById.mockResolvedValue({
            id: 'u1',
            email: 'a@b.com',
            first_name: 'Jane',
            last_name: 'Doe',
        });
        const p = await userService.getProfile('u1');
        expect(p).toEqual({ id: 'u1', email: 'a@b.com', firstName: 'Jane', lastName: 'Doe' });
    });

    test('throws 404 when not found', async () => {
        db.getUserById.mockResolvedValue(undefined);
        await expect(userService.getProfile('nope')).rejects.toMatchObject({ status: 404 });
    });
});

describe('updateProfile', () => {
    test('updates and returns the normalised profile', async () => {
        db.getUserByEmail.mockResolvedValue(undefined);
        db.updateUser.mockResolvedValue();
        const p = await userService.updateProfile('u1', {
            email: 'New@B.com',
            firstName: ' Jane ',
            lastName: ' Doe ',
        });
        expect(p).toEqual({ id: 'u1', email: 'new@b.com', firstName: 'Jane', lastName: 'Doe' });
        expect(db.updateUser).toHaveBeenCalled();
    });

    test('rejects email already used by another account', async () => {
        db.getUserByEmail.mockResolvedValue({ id: 'other' });
        await expect(
            userService.updateProfile('u1', { email: 'a@b.com', firstName: 'Jane', lastName: 'Doe' }),
        ).rejects.toMatchObject({ status: 400 });
    });

    test('allows keeping the same email (same user id)', async () => {
        db.getUserByEmail.mockResolvedValue({ id: 'u1' });
        db.updateUser.mockResolvedValue();
        await expect(
            userService.updateProfile('u1', { email: 'a@b.com', firstName: 'Jane', lastName: 'Doe' }),
        ).resolves.toBeDefined();
    });
});

describe('changePassword', () => {
    test('updates the password when current is correct', async () => {
        db.getUserById.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
        db.getUserByEmail.mockResolvedValue({ password_hash: 'old' });
        bcrypt.compare.mockResolvedValue(true);
        bcrypt.hash.mockResolvedValue('newhash');
        db.updateUserPassword.mockResolvedValue();

        await userService.changePassword('u1', 'oldpass12', 'newpass12');

        expect(db.updateUserPassword).toHaveBeenCalledWith('u1', 'newhash');
    });

    test('rejects when current password is wrong', async () => {
        db.getUserById.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
        db.getUserByEmail.mockResolvedValue({ password_hash: 'old' });
        bcrypt.compare.mockResolvedValue(false);
        await expect(
            userService.changePassword('u1', 'wrong', 'newpass12'),
        ).rejects.toMatchObject({ status: 400 });
    });

    test('rejects missing or too-short new password', async () => {
        await expect(userService.changePassword('u1', 'x', '')).rejects.toMatchObject({ status: 400 });
        await expect(userService.changePassword('u1', 'oldpass12', 'short')).rejects.toMatchObject({ status: 400 });
    });
});

describe('deleteAccount', () => {
    test('removes the user and publishes a user.deleted event', async () => {
        db.deleteUser.mockResolvedValue();
        await userService.deleteAccount('u1');
        expect(db.deleteUser).toHaveBeenCalledWith('u1');
        expect(bus.publish).toHaveBeenCalledWith(
            'user-events',
            'u1',
            { type: 'user.deleted', userId: 'u1' },
        );
    });
});
