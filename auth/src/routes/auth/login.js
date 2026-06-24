const userService = require('../../services/userService');

const IS_PROD = process.env.NODE_ENV === 'production';

module.exports = async (req, res) => {
    try {
        const { email, password } = req.body;
        const { token, user } = await userService.login(email, password);

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'strict',
            secure: IS_PROD,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        });

        res.json(user);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};
