const userService = require('../../../src/services/userService');
const deleteAccount = require('../../../src/routes/auth/deleteAccount');

jest.mock('../../../src/services/userService', () => ({ deleteAccount: jest.fn() }));

function mockRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        clearCookie: jest.fn().mockReturnThis(),
    };
}

beforeEach(() => jest.clearAllMocks());

test('deletes the account, clears the cookie and returns a message', async () => {
    userService.deleteAccount.mockResolvedValue();
    const res = mockRes();

    await deleteAccount({ user: { id: 'u1' } }, res);

    expect(userService.deleteAccount).toHaveBeenCalledWith('u1');
    expect(res.clearCookie).toHaveBeenCalledWith(
        'token',
        expect.objectContaining({ httpOnly: true, sameSite: 'strict' }),
    );
    expect(res.json).toHaveBeenCalledWith({ message: 'Account deleted' });
});

test('maps a service error', async () => {
    const err = new Error('boom');
    err.status = 500;
    userService.deleteAccount.mockRejectedValue(err);
    const res = mockRes();

    await deleteAccount({ user: { id: 'u1' } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
});
