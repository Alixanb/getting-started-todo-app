const userService = require('../../../src/services/userService');
const changePassword = require('../../../src/routes/auth/changePassword');

jest.mock('../../../src/services/userService', () => ({ changePassword: jest.fn() }));

function mockRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
}

beforeEach(() => jest.clearAllMocks());

test('changes the password and returns a message', async () => {
    userService.changePassword.mockResolvedValue();
    const req = { user: { id: 'u1' }, body: { currentPassword: 'oldpass12', newPassword: 'newpass12' } };
    const res = mockRes();

    await changePassword(req, res);

    expect(userService.changePassword).toHaveBeenCalledWith('u1', 'oldpass12', 'newpass12');
    expect(res.json).toHaveBeenCalledWith({ message: 'Password updated' });
});

test('maps a 400 service error', async () => {
    const err = new Error('Current password is incorrect');
    err.status = 400;
    userService.changePassword.mockRejectedValue(err);
    const res = mockRes();

    await changePassword({ user: { id: 'u1' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
});
