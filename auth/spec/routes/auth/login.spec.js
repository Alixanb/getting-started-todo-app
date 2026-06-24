const userService = require('../../../src/services/userService');
const login = require('../../../src/routes/auth/login');

jest.mock('../../../src/services/userService', () => ({ login: jest.fn() }));

function mockRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        cookie: jest.fn().mockReturnThis(),
    };
}

beforeEach(() => jest.clearAllMocks());

test('sets the JWT cookie and returns the user', async () => {
    userService.login.mockResolvedValue({ token: 'jwt-token', user: { id: 'u1' } });
    const res = mockRes();

    await login({ body: { email: 'a@b.com', password: 'password123' } }, res);

    expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'jwt-token',
        expect.objectContaining({ httpOnly: true, sameSite: 'strict' }),
    );
    expect(res.json).toHaveBeenCalledWith({ id: 'u1' });
});

test('maps a 401 service error', async () => {
    const err = new Error('Invalid credentials');
    err.status = 401;
    userService.login.mockRejectedValue(err);
    const res = mockRes();

    await login({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.cookie).not.toHaveBeenCalled();
});
