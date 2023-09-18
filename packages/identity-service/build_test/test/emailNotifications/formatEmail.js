"use strict";
const assert = require('assert');
const models = require('../../src/models');
const processNotifications = require('../../src/notifications/processNotifications/index.js');
const moment = require('moment');
const { clearDatabase, runMigrations } = require('../lib/app');
/**
 * User id 2 reposts track id 1 created by user id 1
 */
const respostNotifications = [
    {
        'blocknumber': 2,
        'initiator': 2,
        'metadata': {
            'entity_id': 1,
            'entity_owner_id': 1,
            'entity_type': 'track'
        },
        'timestamp': '2020-10-01T19:39:45 Z',
        'type': 'Repost'
    }
];
/**
 * User id 2 follows user id 1
 * User id 3 follows user id 1
 */
const initFollows = [
    {
        'blocknumber': 3,
        'initiator': 2,
        'metadata': {
            'followee_user_id': 1,
            'follower_user_id': 2
        },
        'timestamp': '2020-10-03T19:39:45 Z',
        'type': 'Follow'
    }, {
        'blocknumber': 3,
        'initiator': 3,
        'metadata': {
            'followee_user_id': 1,
            'follower_user_id': 3
        },
        'timestamp': '2020-10-03T19:39:45 Z',
        'type': 'Follow'
    }
];
/**
 * User id 2 favorites track id 1 created by user id 1
 */
const favoriteNotifications = [
    {
        'blocknumber': 4,
        'initiator': 2,
        'metadata': {
            'entity_id': 1,
            'entity_owner_id': 1,
            'entity_type': 'track'
        },
        'timestamp': '2020-10-04T19:39:45 Z',
        'type': 'Favorite'
    }
];
/**
 * User id 4 follows user id 1
 */
const additionalFollows = [
    {
        'blocknumber': 5,
        'initiator': 4,
        'metadata': {
            'followee_user_id': 1,
            'follower_user_id': 4
        },
        'timestamp': '2020-10-05T19:39:45 Z',
        'type': 'Follow'
    }
];
describe('Test Favorite Notification', function () {
    beforeEach(async () => {
        await clearDatabase();
        await runMigrations();
    });
    it('should order the email notification actions from most recent to least', async function () {
        // ======================================= Process initial Notifications =======================================
        const tx1 = await models.sequelize.transaction();
        await processNotifications(respostNotifications, tx1);
        await tx1.commit();
        const tx2 = await models.sequelize.transaction();
        await processNotifications(initFollows, tx2);
        await tx2.commit();
        const tx3 = await models.sequelize.transaction();
        await processNotifications(favoriteNotifications, tx3);
        await tx3.commit();
        // ======================================= Run checks against the Notifications =======================================
        const userId = 1;
        const fromTime = moment('2020-01-01');
        const limit = 5;
        const { rows: notifications } = await models.Notification.findAndCountAll({
            where: {
                userId,
                isViewed: false,
                isRead: false,
                isHidden: false,
                timestamp: {
                    [models.Sequelize.Op.gt]: fromTime.toDate()
                }
            },
            order: [
                ['timestamp', 'DESC'],
                ['entityId', 'ASC'],
                [{ model: models.NotificationAction, as: 'actions' }, 'createdAt', 'DESC']
            ],
            include: [{
                    model: models.NotificationAction,
                    required: true,
                    as: 'actions'
                }],
            limit
        });
        assert.deepStrictEqual(notifications.map(n => n.type), ['FavoriteTrack', 'Follow', 'RepostTrack']);
        let followNotif = notifications.find(notif => notif.type === 'Follow');
        assert.deepStrictEqual(followNotif.actions.map(n => n.actionEntityId), [3, 2]);
        // ======================================= Process more follow notifications =======================================
        const tx4 = await models.sequelize.transaction();
        await processNotifications(additionalFollows, tx4);
        await tx4.commit();
        const { rows: nextNotifs } = await models.Notification.findAndCountAll({
            where: {
                userId,
                isViewed: false,
                isRead: false,
                isHidden: false,
                timestamp: {
                    [models.Sequelize.Op.gt]: fromTime.toDate()
                }
            },
            order: [
                ['timestamp', 'DESC'],
                ['entityId', 'ASC'],
                [{ model: models.NotificationAction, as: 'actions' }, 'createdAt', 'DESC']
            ],
            include: [{
                    model: models.NotificationAction,
                    required: true,
                    as: 'actions'
                }],
            limit
        });
        assert.deepStrictEqual(nextNotifs.map(n => n.type), ['Follow', 'FavoriteTrack', 'RepostTrack']);
        followNotif = nextNotifs.find(notif => notif.type === 'Follow');
        assert.deepStrictEqual(followNotif.actions.map(n => n.actionEntityId), [4, 3, 2]);
    });
});
