const userService = require('../../services/userService');

module.exports = async (req, res) => {
    try {
        const { email, firstName, lastName } = req.body;
        const user = await userService.updateProfile(req.user.id, { email, firstName, lastName });
        res.json(user);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};
