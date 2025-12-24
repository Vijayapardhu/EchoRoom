const matchingService = require('../src/services/matchingService');

describe('MatchingService', () => {
    beforeEach(() => {
        // Reset queue before each test
        matchingService.queue = [];
    });

    test('should add user to queue', () => {
        matchingService.addUserToQueue('socket-1', { interest: 'music' });
        expect(matchingService.queue.length).toBe(1);
        expect(matchingService.queue[0].socketId).toBe('socket-1');
    });

    test('should remove user from queue', () => {
        matchingService.addUserToQueue('socket-1', { interest: 'music' });
        matchingService.removeUserFromQueue('socket-1');
        expect(matchingService.queue.length).toBe(0);
    });

    test('should match two users', () => {
        // Add first user
        const match1 = matchingService.addUserToQueue('socket-1', { interest: 'music' });
        expect(match1).toBeNull(); // No match yet

        // Add second user
        const match2 = matchingService.addUserToQueue('socket-2', { interest: 'music' });

        // Should return the first user as a match for the second user
        expect(match2).toBeDefined();
        expect(match2.socketId).toBe('socket-1');

        // Queue should be empty after match
        expect(matchingService.queue.length).toBe(0);
    });

    test('should not match user with themselves', () => {
        matchingService.addUserToQueue('socket-1', { interest: 'music' });
        const match = matchingService.findMatch({ socketId: 'socket-1' });
        expect(match).toBeNull();
    });
});
