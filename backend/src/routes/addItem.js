const itemService = require('../services/itemService');

module.exports = async (req, res) => {
    try {
        const item = await itemService.addItem(req.body.name, req.user.id);
        res.status(201).send(item);
    } catch (err) {
        res.status(err.status || 500).send({ error: err.message });
    }
};
