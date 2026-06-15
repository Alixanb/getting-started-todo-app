const userService = require('../../../src/services/userService');
const me = require('../../../src/routes/auth/me');

jest.mock('../../../src/services/userService', () => ({ getProfile: jest.fn() }));

function mockRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
}

beforeEach(() => jest.clearAllMocks());

test('returns the current user profile', async () => {
    const user = { id: 'u1', email: 'a@b.com' };
    userService.getProfile.mockResolvedValue(user);
    const res = mockRes();

    await me({ user: { id: 'u1' } }, res);

    expect(userService.getProfile).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith(user);
});

test('maps a 404 service error', async () => {
    const err = new Error('User not found');
    err.status = 404;
    userService.getProfile.mockRejectedValue(err);
    const res = mockRes();

    await me({ user: { id: 'gone' } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
});
