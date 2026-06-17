const userService = require('../../services/userService');

module.exports = async (req, res) => {
    try {
        await userService.deleteAccount(req.user.id);
        res.clearCookie('token', { httpOnly: true, sameSite: 'strict' });
        res.json({ message: 'Account deleted' });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};
