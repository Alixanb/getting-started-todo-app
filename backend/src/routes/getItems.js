const itemService = require('../services/itemService');

module.exports = async (req, res) => {
    try {
        const items = await itemService.getItems(req.user.id);
        res.send(items);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
};
