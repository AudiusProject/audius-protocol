"use strict";
const assert = require('assert');
const processPlaylistUpdateNotifications = require('../../src/notifications/processNotifications/playlistUpdateNotification');
const models = require('../../src/models');
const { clearDatabase, runMigrations } = require('../lib/app');
const { createSeedData } = require('../lib/dataSeeds');
/**
 * NOTE: 500,000 users takes 2.5 min for the bulk upsert
 */
const numUsers = 100000;
const playlistId = 22;
const initialNotifications = [
    { "blocknumber": 30015701,
        "initiator": 1,
        "metadata": {
            "entity_id": playlistId,
            "entity_type": "playlist",
            "playlist_update_timestamp": "2022-11-14T23:49:20 Z",
            "playlist_update_users": Array.from({ length: numUsers }, (_, i) => i + 1)
        },
        "timestamp": "2020-01-11T00:08:35 Z",
        "type": "PlaylistUpdate"
    }
];
describe('Test Playlist Update Notification', function () {
    beforeEach(async () => {
        await clearDatabase();
        await runMigrations();
    });
    it('should update the user events table with json for playlist update notification', async function () {
        // Set timeout to 30 seconds
        this.timeout(20 * 60 * 1000);
        // ======================================= Process initial Notifications =======================================
        const size = numUsers;
        const user = Array(size).fill({});
        await createSeedData({ user });
        const tx1 = await models.sequelize.transaction();
        await processPlaylistUpdateNotifications(initialNotifications, tx1);
        await tx1.commit();
        // No additional notifications should be created
        const userEvents = await models.UserEvents.findAll();
        assert.deepStrictEqual(userEvents.length, numUsers);
        const userEvent = await models.UserEvents.findOne({ where: { walletAddress: '0x1' } });
        assert.ok(userEvent.playlistUpdates[playlistId]);
        assert.ok(userEvent.playlistUpdates[playlistId].userLastViewed);
        assert.ok(userEvent.playlistUpdates[playlistId].lastUpdated);
    });
});
