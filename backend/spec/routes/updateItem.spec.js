const itemService = require('../../src/services/itemService');
const updateItem = require('../../src/routes/updateItem');

jest.mock('../../src/services/itemService', () => ({
    updateItem: jest.fn(),
}));

test('it updates items correctly', async () => {
    const updatedItem = { id: 1234, name: 'New title', completed: false };
    const req = {
        params: { id: 1234 },
        body: { name: 'New title', completed: false },
    };
    const res = { send: jest.fn(), status: jest.fn().mockReturnThis() };

    itemService.updateItem.mockResolvedValue(updatedItem);

    await updateItem(req, res);

    expect(itemService.updateItem).toHaveBeenCalledWith(req.params.id, {
        name: 'New title',
        completed: false,
    });
    expect(res.send).toHaveBeenCalledWith(updatedItem);
});
