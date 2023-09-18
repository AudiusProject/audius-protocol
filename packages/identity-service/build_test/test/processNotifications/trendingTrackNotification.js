"use strict";
const assert = require('assert');
const moment = require('moment');
const nock = require('nock');
const models = require('../../src/models');
const { processTrendingTracks, getTimeGenreActionType, TRENDING_TIME, TRENDING_GENRE, getTrendingTracks } = require('../../src/notifications/trendingTrackProcessing');
const { notificationTypes } = require('../../src/notifications/constants');
const { clearDatabase, runMigrations } = require('../lib/app');
const { encodeHashId } = require('../../src/notifications/utils');
/**
 * Track id 100 owned by user id 1 is #1 trending
 * Track id 101 owned by user id 1 is #2 trending
 * Track id 102 owned by user id 2 is #3 trending
 * Track id 103 owned by user id 3 is #4 trending
 * Track id 104 owned by user id 4 is #5 trending
 */
const initialNotifications = [
    {
        trackId: 100,
        userId: 1,
        rank: 1,
        type: notificationTypes.TrendingTrack
    },
    {
        trackId: 101,
        userId: 1,
        rank: 2,
        type: notificationTypes.TrendingTrack
    },
    {
        trackId: 102,
        userId: 2,
        rank: 3,
        type: notificationTypes.TrendingTrack
    },
    {
        trackId: 103,
        userId: 3,
        rank: 4,
        type: notificationTypes.TrendingTrack
    },
    {
        trackId: 104,
        userId: 4,
        rank: 5,
        type: notificationTypes.TrendingTrack
    }
];
/**
 * Track id 103 owned by user id 3 is #1 trending <= increase
 * Track id 104 owned by user id 4 is #2 trending <= increase
 * Track id 100 owned by user id 1 is #3 trending <= decrease
 * Track id 110 owned by user id 10 is #4 trending <= new
 * Track id 101 owned by user id 1 is #5 trending <= decrease
 */
const additionalNotifications = [
    {
        trackId: 103,
        userId: 3,
        rank: 1,
        type: notificationTypes.TrendingTrack
    },
    {
        trackId: 104,
        userId: 4,
        rank: 2,
        type: notificationTypes.TrendingTrack
    },
    {
        trackId: 100,
        userId: 1,
        rank: 3,
        type: notificationTypes.TrendingTrack
    },
    {
        trackId: 110,
        userId: 10,
        rank: 4,
        type: notificationTypes.TrendingTrack
    },
    {
        trackId: 101,
        userId: 1,
        rank: 5,
        type: notificationTypes.TrendingTrack
    }
];
const makeTrendingResponse = (ids) => {
    const data = ids.map((id) => ({
        title: `Track ${id}`,
        description: `Track description ${id}`,
        genre: 'Electronic',
        id: encodeHashId(id),
        user: {
            id: encodeHashId(id)
        }
    }));
    return {
        data,
        latest_indexed_block: 100
    };
};
describe('Test Trending Track Notification', () => {
    beforeEach(async () => {
        await clearDatabase();
        await runMigrations();
    });
    it('should query discovery nodes for consensus', async () => {
        const endpoints = [
            'https://discoverya.com',
            'https://discoveryb.com',
            'https://discoveryc.com'
        ];
        nock(endpoints[0])
            .get('/v1/full/tracks/trending?time=week&limit=10')
            .reply(200, makeTrendingResponse([1, 8, 6, 4, 5, 3, 2, 9, 10, 7]));
        nock(endpoints[1])
            .get('/v1/full/tracks/trending?time=week&limit=10')
            .reply(200, makeTrendingResponse([1, 8, 6, 4, 5, 3, 2, 9, 10, 7]));
        nock(endpoints[2])
            .get('/v1/full/tracks/trending?time=week&limit=10')
            .reply(200, makeTrendingResponse([1, 8, 6, 4, 5, 3, 2, 9, 10, 7]));
        const { trendingTracks } = await getTrendingTracks('', endpoints);
        assert.deepStrictEqual(trendingTracks, [
            { trackId: 1, rank: 1, userId: 1 },
            { trackId: 8, rank: 2, userId: 8 },
            { trackId: 6, rank: 3, userId: 6 },
            { trackId: 4, rank: 4, userId: 4 },
            { trackId: 5, rank: 5, userId: 5 },
            { trackId: 3, rank: 6, userId: 3 },
            { trackId: 2, rank: 7, userId: 2 },
            { trackId: 9, rank: 8, userId: 9 },
            { trackId: 10, rank: 9, userId: 10 },
            { trackId: 7, rank: 10, userId: 7 }
        ]);
    });
    it('should fail to notify when not reaching consensus', async () => {
        const endpoints = [
            'https://discoverya.com',
            'https://discoveryb.com',
            'https://discoveryc.com'
        ];
        nock(endpoints[0])
            .get('/v1/full/tracks/trending?time=week&limit=10')
            .reply(200, makeTrendingResponse([1, 8, 6, 4, 5, 3, 2, 9, 10, 7]));
        nock(endpoints[1])
            .get('/v1/full/tracks/trending?time=week&limit=10')
            // Note: items 2 & 3 are flipped here
            .reply(200, makeTrendingResponse([1, 8, 6, 4, 5, 2, 3, 9, 10, 7]));
        nock(endpoints[2])
            .get('/v1/full/tracks/trending?time=week&limit=10')
            .reply(200, makeTrendingResponse([1, 8, 6, 4, 5, 3, 2, 9, 10, 7]));
        const result = await getTrendingTracks('', endpoints);
        assert.deepStrictEqual(result, null);
    });
    it('should insert rows into notifications and notifications actions tables', async () => {
        // ======================================= Process initial Notifications =======================================
        const tx1 = await models.sequelize.transaction();
        await processTrendingTracks(null, 1, initialNotifications, tx1);
        await tx1.commit();
        // ======================================= Run checks against the Notifications =======================================
        // User 20 Should have 2 notifications
        // 1.) users 1 & 2 liked track 10 (owned by user 20)
        // 2) user 2 liked track 11 (owned by user 20)
        const user1Notifs = await models.Notification.findAll({
            where: { userId: 1 }
        });
        assert.deepStrictEqual(user1Notifs.length, 2);
        const track100Notification = user1Notifs.find((notif) => notif.entityId === 100);
        assert.ok(track100Notification);
        const track101Notification = user1Notifs.find((notif) => notif.entityId === 101);
        assert.ok(track101Notification);
        // For the track 100 rank 1 check that the notification action is correct
        const track100NotificationActions = await models.NotificationAction.findAll({ where: { notificationId: track100Notification.id } });
        assert.deepStrictEqual(track100NotificationActions.length, 1);
        assert.deepStrictEqual(track100NotificationActions[0].actionEntityId, 1);
        assert.deepStrictEqual(track100NotificationActions[0].actionEntityType, getTimeGenreActionType(TRENDING_TIME.WEEK, TRENDING_GENRE.ALL));
        // For the track 100 rank 1 check that the notification action is correct
        const track101NotificationActions = await models.NotificationAction.findAll({ where: { notificationId: track101Notification.id } });
        assert.deepStrictEqual(track101NotificationActions.length, 1);
        assert.deepStrictEqual(track101NotificationActions[0].actionEntityId, 2);
        assert.deepStrictEqual(track101NotificationActions[0].actionEntityType, getTimeGenreActionType(TRENDING_TIME.WEEK, TRENDING_GENRE.ALL));
        const allNotifs = await models.Notification.findAll();
        assert.deepStrictEqual(allNotifs.length, 5);
        const allNotifActions = await models.NotificationAction.findAll();
        assert.deepStrictEqual(allNotifActions.length, 5);
        // increase time
        // ======================================= Process the same trending tracks =======================================
        const tx2 = await models.sequelize.transaction();
        await processTrendingTracks(null, 2, initialNotifications, tx2);
        await tx2.commit();
        // Check that there are the same number of notifications
        const allNotifsAfter = await models.Notification.findAll();
        assert.deepStrictEqual(allNotifsAfter.length, 5);
        const allNotifActionsAfter = await models.NotificationAction.findAll();
        assert.deepStrictEqual(allNotifActionsAfter.length, 5);
        // Do some more checks
        const threeHrsAgo = moment(Date.now()).subtract(1, 'h');
        await models.Notification.update({ timestamp: threeHrsAgo }, { where: {} });
        // ======================================= Process the new trending tracks =======================================
        const tx3 = await models.sequelize.transaction();
        await processTrendingTracks(null, 3, additionalNotifications, tx3);
        await tx3.commit();
        // Check that there is one more notification
        const allNotifsAfterUpdated = await models.Notification.findAll();
        console.log({
            allNotifsAfterUpdated: allNotifsAfterUpdated.map((n) => ({
                userId: n.userId,
                track: n.entityId
            }))
        });
        assert.deepStrictEqual(allNotifsAfterUpdated.length, 6);
        const user10Notifs = await models.Notification.findAll({
            where: { userId: 10 }
        });
        assert.deepStrictEqual(user10Notifs.length, 1);
        const track110Notification = user10Notifs.find((notif) => notif.entityId === 110);
        assert.ok(track110Notification);
        // Do some more checks
        const sevenHrsAgo = moment(Date.now()).subtract(7, 'h');
        await models.Notification.update({ timestamp: sevenHrsAgo }, { where: {} });
        // ======================================= Process the new trending tracks =======================================
        const tx4 = await models.sequelize.transaction();
        await processTrendingTracks(null, 4, additionalNotifications, tx4);
        await tx4.commit();
        // Check that there is one more notification
        const allNotifsAfterAll = await models.Notification.findAll();
        assert.deepStrictEqual(allNotifsAfterAll.length, 8);
        const user4Notifs = await models.Notification.findAll({
            where: { userId: 4 }
        });
        assert.deepStrictEqual(user4Notifs.length, 2);
        const user3Notifs = await models.Notification.findAll({
            where: { userId: 3 }
        });
        assert.deepStrictEqual(user3Notifs.length, 2);
    });
});
