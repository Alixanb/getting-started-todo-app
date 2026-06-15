const userService = require('../../../src/services/userService');
const updateMe = require('../../../src/routes/auth/updateMe');

jest.mock('../../../src/services/userService', () => ({ updateProfile: jest.fn() }));

function mockRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
}

beforeEach(() => jest.clearAllMocks());

test('updates the profile and returns it', async () => {
    const updated = { id: 'u1', email: 'new@b.com', firstName: 'Jane', lastName: 'Doe' };
    userService.updateProfile.mockResolvedValue(updated);
    const req = { user: { id: 'u1' }, body: { email: 'new@b.com', firstName: 'Jane', lastName: 'Doe' } };
    const res = mockRes();

    await updateMe(req, res);

    expect(userService.updateProfile).toHaveBeenCalledWith('u1', {
        email: 'new@b.com',
        firstName: 'Jane',
        lastName: 'Doe',
    });
    expect(res.json).toHaveBeenCalledWith(updated);
});

test('maps a 400 service error', async () => {
    const err = new Error('Invalid email address');
    err.status = 400;
    userService.updateProfile.mockRejectedValue(err);
    const res = mockRes();

    await updateMe({ user: { id: 'u1' }, body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(400);
});
