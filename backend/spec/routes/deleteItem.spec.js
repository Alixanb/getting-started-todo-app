const itemService = require('../../src/services/itemService');
const deleteItem = require('../../src/routes/deleteItem');

jest.mock('../../src/services/itemService', () => ({
    deleteItem: jest.fn(),
}));

test('it removes item correctly', async () => {
    const req = { params: { id: 12345 } };
    const res = { sendStatus: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() };

    itemService.deleteItem.mockResolvedValue();

    await deleteItem(req, res);

    expect(itemService.deleteItem).toHaveBeenCalledWith(req.params.id);
    expect(res.sendStatus).toHaveBeenCalledWith(200);
});
