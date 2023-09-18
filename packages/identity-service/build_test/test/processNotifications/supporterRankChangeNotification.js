"use strict";
const assert = require('assert');
const models = require('../../src/models');
const processSupporterRankChangeNotification = require('../../src/notifications/processNotifications/supporterRankChangeNotification');
const utils = require('../../src/notifications/utils');
const sinon = require('sinon');
const { clearDatabase, runMigrations } = require('../lib/app');
const { notificationTypes } = require('../../src/notifications/constants');
/**
 * User id 1 follows user id 2
 * User id 1 follows user id 3
 * User id 2 follows user id 3
 */
const initialNotifications = [
    {
        initiator: 1,
        metadata: {
            entity_id: 2,
            entity_type: 'user',
            rank: 1
        },
        slot: 10,
        type: 'SupporterRankUp'
    }
];
// audiusLibs.Utils.encodeHashId(2) = 'ML51L'
// audiusLibs.Utils.encodeHashId(3) = 'lebQD'
describe('Test Supporter Rank Change Notification', function () {
    beforeEach(async () => {
        await clearDatabase();
        await runMigrations();
        sinon
            .stub(utils, 'getSupporters')
            .returns([
            { sender: { id: 'ML51L' }, amount: 11 },
            { sender: { id: 'lebQD' }, amount: 9 }
        ]);
    });
    it('should insert rows into notifications and notifications actions tables', async function () {
        // ======================================= Process initial Notifications =======================================
        const tx1 = await models.sequelize.transaction();
        const processedNotifications = await processSupporterRankChangeNotification(initialNotifications, tx1);
        await tx1.commit();
        // User 1 should have a SupporterRankUp  notification
        const updatedUser1Notifs = await models.SolanaNotification.findAll({
            where: { userId: 1 }
        });
        assert.deepStrictEqual(updatedUser1Notifs.length, 1);
        // User 2 should have a supporter rank up notification
        const updatedUser2Notifs = await models.SolanaNotification.findAll({
            where: { userId: 2 }
        });
        assert.deepStrictEqual(updatedUser2Notifs.length, 1);
        // User 3 should have a dethroned notification
        const updatedUser3Notifs = await models.SolanaNotification.findAll({
            where: { userId: 2 }
        });
        assert.deepStrictEqual(updatedUser3Notifs.length, 1);
        assert.deepStrictEqual(processedNotifications.length, 2);
        assert.deepStrictEqual(processedNotifications[1], {
            slot: 10,
            type: notificationTypes.SupporterDethroned,
            initiator: 3,
            metadata: {
                supportedUserId: 1,
                newTopSupporterUserId: 2,
                oldAmount: 9,
                newAmount: 11
            }
        });
    });
});
