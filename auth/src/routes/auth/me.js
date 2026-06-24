const userService = require('../../services/userService');

module.exports = async (req, res) => {
    try {
        const user = await userService.getProfile(req.user.id);
        res.json(user);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};
