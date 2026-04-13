const itemService = require('../services/itemService');

module.exports = async (req, res) => {
    try {
        const item = await itemService.updateItem(req.params.id, {
            name: req.body.name,
            completed: req.body.completed,
        });
        res.send(item);
    } catch (err) {
        res.status(err.status || 500).send({ error: err.message });
    }
};
