const itemService = require('../../src/services/itemService');
const getItems = require('../../src/routes/getItems');

jest.mock('../../src/services/itemService', () => ({
    getItems: jest.fn(),
}));

test('it gets items correctly', async () => {
    const ITEMS = [{ id: 12345 }];
    const req = { user: { id: 'user-1' } };
    const res = { send: jest.fn(), status: jest.fn().mockReturnThis() };

    itemService.getItems.mockResolvedValue(ITEMS);

    await getItems(req, res);

    expect(itemService.getItems).toHaveBeenCalledWith('user-1');
    expect(res.send).toHaveBeenCalledWith(ITEMS);
});
