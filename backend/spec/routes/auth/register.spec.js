const userService = require('../../../src/services/userService');
const register = require('../../../src/routes/auth/register');

jest.mock('../../../src/services/userService', () => ({ register: jest.fn() }));

function mockRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
}

beforeEach(() => jest.clearAllMocks());

test('registers a user and returns 201', async () => {
    const user = { id: 'u1', email: 'a@b.com' };
    userService.register.mockResolvedValue(user);
    const req = { body: { email: 'a@b.com', firstName: 'Jane', lastName: 'Doe', password: 'password123' } };
    const res = mockRes();

    await register(req, res);

    expect(userService.register).toHaveBeenCalledWith('a@b.com', 'Jane', 'Doe', 'password123');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(user);
});

test('maps a service error to its status', async () => {
    const err = new Error('bad');
    err.status = 400;
    userService.register.mockRejectedValue(err);
    const res = mockRes();

    await register({ body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'bad' });
});
