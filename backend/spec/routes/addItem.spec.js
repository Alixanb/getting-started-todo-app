const itemService = require('../../src/services/itemService');
const addItem = require('../../src/routes/addItem');

jest.mock('../../src/services/itemService', () => ({
    addItem: jest.fn(),
}));

test('it stores item correctly', async () => {
    const item = { id: 'some-uuid', name: 'A sample item', completed: false };
    const req = { body: { name: item.name }, user: { id: 'user-1' } };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    itemService.addItem.mockResolvedValue(item);

    await addItem(req, res);

    expect(itemService.addItem).toHaveBeenCalledWith(item.name, 'user-1');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(item);
});

test('it returns 400 on validation error', async () => {
    const req = { body: { name: '' }, user: { id: 'user-1' } };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    const err = new Error('Name is required');
    err.status = 400;
    itemService.addItem.mockRejectedValue(err);

    await addItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ error: 'Name is required' });
});
