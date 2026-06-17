const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const db = require('../persistence');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ─── Validation helpers ───────────────────────────────────────────────────────

function validateEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    return typeof password === 'string' && password.length >= 8;
}

function validateName(value) {
    return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 100;
}

function clientError(message) {
    const err = new Error(message);
    err.status = 400;
    return err;
}

function unauthorizedError(message = 'Invalid credentials') {
    const err = new Error(message);
    err.status = 401;
    return err;
}

// ─── Service methods ──────────────────────────────────────────────────────────

async function register(email, firstName, lastName, password) {
    if (!validateEmail(email)) throw clientError('Invalid email address');
    if (!validateName(firstName)) throw clientError('First name is required (max 100 chars)');
    if (!validateName(lastName)) throw clientError('Last name is required (max 100 chars)');
    if (!validatePassword(password)) throw clientError('Password must be at least 8 characters');

    const existing = await db.getUserByEmail(email.toLowerCase());
    if (existing) throw clientError('An account with this email already exists');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = {
        id: uuid(),
        email: email.toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        passwordHash,
    };
    await db.createUser(user);

    return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName };
}

async function login(email, password) {
    if (!email || !password) throw unauthorizedError();

    const user = await db.getUserByEmail(email.toLowerCase());
    if (!user) throw unauthorizedError();

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw unauthorizedError();

    const token = jwt.sign(
        { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
    );

    return {
        token,
        user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name },
    };
}

async function getProfile(userId) {
    const user = await db.getUserById(userId);
    if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }
    return { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name };
}

async function updateProfile(userId, { email, firstName, lastName }) {
    if (!validateEmail(email)) throw clientError('Invalid email address');
    if (!validateName(firstName)) throw clientError('First name is required (max 100 chars)');
    if (!validateName(lastName)) throw clientError('Last name is required (max 100 chars)');

    const existing = await db.getUserByEmail(email.toLowerCase());
    if (existing && existing.id !== userId) throw clientError('Email already used by another account');

    await db.updateUser(userId, {
        email: email.toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
    });

    return { id: userId, email: email.toLowerCase(), firstName: firstName.trim(), lastName: lastName.trim() };
}

async function changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) throw clientError('Both passwords are required');
    if (!validatePassword(newPassword)) throw clientError('New password must be at least 8 characters');

    const user = await db.getUserById(userId);
    // getUserById omits password_hash — fetch full record via email would need another method,
    // so we use a raw lookup here
    const fullUser = await db.getUserByEmail(user.email);
    const valid = await bcrypt.compare(currentPassword, fullUser.password_hash);
    if (!valid) throw clientError('Current password is incorrect');

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.updateUserPassword(userId, newHash);
}

async function deleteAccount(userId) {
    await db.deleteUserItems(userId);
    await db.deleteUser(userId);
}

module.exports = { register, login, getProfile, updateProfile, changePassword, deleteAccount };
