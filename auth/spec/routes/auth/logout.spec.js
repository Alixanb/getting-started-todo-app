const logout = require('../../../src/routes/auth/logout');

test('clears the token cookie and returns a message', () => {
    const res = {
        clearCookie: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };

    logout({}, res);

    expect(res.clearCookie).toHaveBeenCalledWith(
        'token',
        expect.objectContaining({ httpOnly: true, sameSite: 'strict' }),
    );
    expect(res.json).toHaveBeenCalledWith({ message: 'Logged out' });
});
