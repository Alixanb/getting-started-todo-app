const userService = require('../../services/userService');

module.exports = async (req, res) => {
    try {
        const { email, firstName, lastName, password } = req.body;
        const user = await userService.register(email, firstName, lastName, password);
        res.status(201).json(user);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};
