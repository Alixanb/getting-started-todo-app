/**
 * Unit tests for the Kafka consumer's business logic (handleUserEvent).
 * Persistence and cache are mocked so the handler runs without infra.
 */
jest.mock('../src/persistence', () => ({ deleteUserItems: jest.fn() }));
jest.mock('../src/cache', () => ({ del: jest.fn() }));
jest.mock('../src/bus', () => ({ startConsumer: jest.fn() }));

const db = require('../src/persistence');
const cache = require('../src/cache');
const bus = require('../src/bus');
const {
    handleUserEvent,
    startUserEventsConsumer,
    TOPIC,
    GROUP_ID,
} = require('../src/consumer');

beforeEach(() => jest.clearAllMocks());

test('startUserEventsConsumer subscribes to the user-events topic', async () => {
    bus.startConsumer.mockResolvedValue();
    await startUserEventsConsumer();
    expect(bus.startConsumer).toHaveBeenCalledWith(GROUP_ID, TOPIC, handleUserEvent);
});

test('purges items and invalidates cache on user.deleted', async () => {
    db.deleteUserItems.mockResolvedValue();
    cache.del.mockResolvedValue();

    await handleUserEvent({ type: 'user.deleted', userId: 'u1' });

    expect(db.deleteUserItems).toHaveBeenCalledWith('u1');
    expect(cache.del).toHaveBeenCalledWith('items:u1');
});

test('ignores unrelated event types', async () => {
    await handleUserEvent({ type: 'user.updated', userId: 'u1' });
    expect(db.deleteUserItems).not.toHaveBeenCalled();
});

test('ignores a user.deleted event without a userId', async () => {
    await handleUserEvent({ type: 'user.deleted' });
    expect(db.deleteUserItems).not.toHaveBeenCalled();
});
