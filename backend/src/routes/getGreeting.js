const GREETING = 'Hello world!';

module.exports = async (req, res) => {
    try {
        res.send({ greeting: GREETING });
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
};
