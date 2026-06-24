/**
 * Unit tests for the JWT auth middleware.
 */
process.env.JWT_SECRET = 'test-secret';

const jwt = require('jsonwebtoken');
const authMiddleware = require('../../src/middleware/auth');

function mockRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };
}

test('returns 401 when no token cookie is present', () => {
    const req = { cookies: {} };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
});

test('returns 401 for an invalid token', () => {
    const req = { cookies: { token: 'garbage' } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
});

test('returns 401 for an expired token', () => {
    const token = jwt.sign({ id: 'u1' }, 'test-secret', { expiresIn: '-1s' });
    const req = { cookies: { token } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
});

test('attaches req.user and calls next for a valid token', () => {
    const token = jwt.sign({ id: 'u1', email: 'a@b.com' }, 'test-secret');
    const req = { cookies: { token } };
    const res = mockRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({ id: 'u1', email: 'a@b.com' });
});
