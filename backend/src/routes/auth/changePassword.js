const userService = require('../../services/userService');

module.exports = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        await userService.changePassword(req.user.id, currentPassword, newPassword);
        res.json({ message: 'Password updated' });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};
