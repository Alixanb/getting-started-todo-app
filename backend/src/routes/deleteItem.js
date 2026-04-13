const itemService = require('../services/itemService');

module.exports = async (req, res) => {
    try {
        await itemService.deleteItem(req.params.id);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
};
