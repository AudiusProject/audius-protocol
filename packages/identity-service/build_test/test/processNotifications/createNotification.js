"use strict";
const assert = require('assert');
const models = require('../../src/models');
const processCreateNotifications = require('../../src/notifications/processNotifications/createNotification');
const { notificationTypes } = require('../../src/notifications/constants');
const { clearDatabase, runMigrations } = require('../lib/app');
/**
 * User id 1 creates track id 1
 * User id 1 creates track id 2
 * User id 1 creates track id 3
 * User id 2 creates track id 4
 * User id 1 creates playlist id 1 with track 2
 */
const initialNotifications = [
    {
        'blocknumber': 1,
        'initiator': 1,
        'metadata': {
            'entity_id': 1,
            'entity_owner_id': 1,
            'entity_type': 'track'
        },
        'timestamp': '2020-10-27T15:14:20 Z',
        'type': 'Create'
    }, {
        'blocknumber': 1,
        'initiator': 1,
        'metadata': {
            'entity_id': 2,
            'entity_owner_id': 1,
            'entity_type': 'track'
        },
        'timestamp': '2020-10-27T15:14:20 Z',
        'type': 'Create'
    }, {
        'blocknumber': 1,
        'initiator': 1,
        'metadata': {
            'entity_id': 3,
            'entity_owner_id': 1,
            'entity_type': 'track'
        },
        'timestamp': '2020-10-27T15:14:20 Z',
        'type': 'Create'
    }, {
        'blocknumber': 1,
        'initiator': 2,
        'metadata': {
            'entity_id': 4,
            'entity_owner_id': 2,
            'entity_type': 'track'
        },
        'timestamp': '2020-10-27T15:14:20 Z',
        'type': 'Create'
    }, {
        'blocknumber': 1,
        'initiator': 1,
        'metadata': {
            'collection_content': {
                'track_ids': [
                    {
                        'time': 1603811420,
                        'track': 2
                    }
                ]
            },
            'entity_id': 1,
            'entity_owner_id': 1,
            'entity_type': 'playlist'
        },
        'timestamp': '2020-10-27T15:10:20 Z',
        'type': 'Create'
    }
];
/**
 * User id 1 creates track id 5
 * User id 2 creates track id 7
 * User id 2 creates track id 8
 * User id 2 creates album id 2 with track 7
 */
const additionalNotifications = [
    {
        'blocknumber': 1,
        'initiator': 1,
        'metadata': {
            'entity_id': 5,
            'entity_owner_id': 1,
            'entity_type': 'track'
        },
        'timestamp': '2020-10-27T15:14:20 Z',
        'type': 'Create'
    },
    {
        'blocknumber': 1,
        'initiator': 2,
        'metadata': {
            'entity_id': 7,
            'entity_owner_id': 1,
            'entity_type': 'track'
        },
        'timestamp': '2020-10-27T15:14:20 Z',
        'type': 'Create'
    },
    {
        'blocknumber': 1,
        'initiator': 2,
        'metadata': {
            'entity_id': 8,
            'entity_owner_id': 1,
            'entity_type': 'track'
        },
        'timestamp': '2020-10-27T15:14:20 Z',
        'type': 'Create'
    }, {
        'blocknumber': 1,
        'initiator': 2,
        'metadata': {
            'collection_content': {
                'track_ids': [
                    {
                        'time': 1603811420,
                        'track': 7
                    }
                ]
            },
            'entity_id': 2,
            'entity_owner_id': 2,
            'entity_type': 'album'
        },
        'timestamp': '2020-10-27T15:10:20 Z',
        'type': 'Create'
    }
];
describe('Test Create Notification', function () {
    beforeEach(async () => {
        await clearDatabase();
        await runMigrations();
    });
    it('should insert rows into notifications and notifications actions tables', async function () {
        // ======================================= Set subscribers for create notifications =======================================
        await models.Subscription.bulkCreate([
            { subscriberId: 10, userId: 1 },
            { subscriberId: 11, userId: 1 },
            { subscriberId: 12, userId: 1 },
            { subscriberId: 10, userId: 2 }
        ]);
        // ======================================= Process initial Notifications =======================================
        const tx1 = await models.sequelize.transaction();
        await processCreateNotifications(initialNotifications, tx1);
        await tx1.commit();
        // ======================================= Run checks against the Notifications =======================================
        // User 11 subscribes to user 1 and gets the notification when user 1 creates tracks 1, 2, 3, and playlist 1 which contains track 2
        const user11Notifs = await models.Notification.findAll({ where: { userId: 11 } });
        assert.deepStrictEqual(user11Notifs.length, 2);
        const user11TrackNotifs = user11Notifs.find(notif => notif.type === notificationTypes.Create.track);
        const user11PlaylistNotif = user11Notifs.find(notif => notif.type === notificationTypes.Create.playlist);
        assert.deepStrictEqual(user11TrackNotifs.entityId, 1); // For tracks the entity id is the creator of the tracks
        assert.deepStrictEqual(user11PlaylistNotif.entityId, 1); // For tracks the entity id is the creator of the tracks
        // Check the notification actions of the track uploads - note there were 3 track uploads but one was a part of a playlist & removed
        const user11TrackNotifActions = await models.NotificationAction.findAll({ where: { notificationId: user11TrackNotifs.id } });
        const userTrackActionTracks = user11TrackNotifActions.map(na => na.actionEntityId);
        userTrackActionTracks.sort();
        assert.deepStrictEqual(userTrackActionTracks, [1, 3]);
        // Check the notification actions of the track uploads - note there were 3 track uploads but one was a part of a playlist & removed
        const user11PlaylistNotifActions = await models.NotificationAction.findAll({ where: { notificationId: user11PlaylistNotif.id } });
        assert.deepStrictEqual(user11PlaylistNotifActions.length, 1);
        assert.deepStrictEqual(user11PlaylistNotifActions[0].actionEntityId, 1);
        // User 10 subscriber to user 1 and user 2
        const user10Notifs = await models.Notification.findAll({ where: { userId: 10 } });
        assert.deepStrictEqual(user10Notifs.length, 3);
        const user10TrackNotifs = user10Notifs.find(notif => notif.type === notificationTypes.Create.track && notif.entityId === 2);
        // Check the notification actions of the track uploads - note there were 3 track uploads but one was a part of a playlist & removed
        const user10TrackNotifActions = await models.NotificationAction.findAll({ where: { notificationId: user10TrackNotifs.id } });
        assert.deepStrictEqual(user10TrackNotifActions.length, 1);
        assert.deepStrictEqual(user10TrackNotifActions[0].actionEntityId, 4); // Track ID 4 was created
        // Check that user 12 also has 2 notifications, should be the same as user 11
        const user12Notifs = await models.Notification.findAll({ where: { userId: 12 } });
        assert.deepStrictEqual(user12Notifs.length, 2);
        // ======================================= Mark some Notifications as viewed =======================================
        user11Notifs[0].isViewed = true;
        await user11Notifs[0].save();
        user11Notifs[1].isViewed = true;
        await user11Notifs[1].save();
        // ======================================= Process additional notifications =======================================
        const tx2 = await models.sequelize.transaction();
        await processCreateNotifications(additionalNotifications, tx2);
        await tx2.commit();
        // User 11 viewed their notifications, so there should be 1 new track notification (trackId 5 made by user 1)
        const user11newNotifs = await models.Notification.findAll({ where: { userId: 11 } });
        assert.deepStrictEqual(user11newNotifs.length, 3);
        const user11NewTrackNotif = user11newNotifs.find(notif => notif.type === notificationTypes.Create.track && notif.isViewed === false);
        assert.deepStrictEqual(user11NewTrackNotif.entityId, 1); // For tracks the entity id is the creator of the tracks
        // Check the notification actions of the new track notif is track ID 5
        const user11NewTrackNotifActions = await models.NotificationAction.findAll({ where: { notificationId: user11NewTrackNotif.id } });
        assert.deepStrictEqual(user11NewTrackNotifActions.length, 1);
        assert.deepStrictEqual(user11NewTrackNotifActions[0].actionEntityId, 5);
        // User 12 is not view the notification, so the new track should tack onto the existing notification via an action
        const user12UpdatedNotifs = await models.Notification.findAll({ where: { userId: 12 } });
        assert.deepStrictEqual(user12UpdatedNotifs.length, 2);
        const user12UpdatedTrackNotif = user12UpdatedNotifs.find(notif => notif.type === notificationTypes.Create.track);
        // Check the notification actions of the new track notif is track ID 5
        const user12NewTrackNotifActions = await models.NotificationAction.findAll({ where: { notificationId: user12UpdatedTrackNotif.id } });
        const updatedNotifTrackIds = user12NewTrackNotifActions.map(na => na.actionEntityId);
        updatedNotifTrackIds.sort();
        assert.deepStrictEqual(updatedNotifTrackIds, [1, 3, 5]);
        // User 10 subscribes to user 1 & 2 but did not view any notifications, so the only new notification should be user 12 album upload
        const updatedUser10Notifs = await models.Notification.findAll({ where: { userId: 10 } });
        assert.deepStrictEqual(updatedUser10Notifs.length, 4); // user 1 track & playlist upload & user 2 track & album upload
        const user10TrackNotifs2 = updatedUser10Notifs.find(notif => notif.type === notificationTypes.Create.track && notif.entityId === 2);
        const user10AlbumNotif = updatedUser10Notifs.find(notif => notif.type === notificationTypes.Create.album);
        assert.deepStrictEqual(user10AlbumNotif.entityId, 2);
        // Check the notification actions of the track uploads - note there were 3 track uploads but one was a part of a playlist & removed
        const user10TrackNotif2Actions = await models.NotificationAction.findAll({ where: { notificationId: user10TrackNotifs2.id } });
        const user10Sub2Tracks = user10TrackNotif2Actions.map(na => na.actionEntityId);
        user10Sub2Tracks.sort();
        assert.deepStrictEqual(user10Sub2Tracks, [4, 8]);
        const user10AlbumActions = await models.NotificationAction.findAll({ where: { notificationId: user10AlbumNotif.id } });
        assert.deepStrictEqual(user10AlbumActions.length, 1);
        assert.deepStrictEqual(user10AlbumActions[0].actionEntityId, 2);
    });
    it('should handle a lot of subscribers for create', async function () {
        // Set timeout to 30 seconds
        this.timeout(30 * 1000);
        // ======================================= Set subscribers for create notifications =======================================
        const NUM_SUBSCRIBERS = 50000;
        await models.Subscription.bulkCreate([...Array(NUM_SUBSCRIBERS).keys()]
            .map((num) => ({
            subscriberId: num + 1,
            userId: 1
        })));
        // ======================================= Process initial Notifications =======================================
        const tx1 = await models.sequelize.transaction();
        await processCreateNotifications([{
                'blocknumber': 1,
                'initiator': 1,
                'metadata': {
                    'entity_id': 1,
                    'entity_owner_id': 1,
                    'entity_type': 'track'
                },
                'timestamp': '2020-10-27T15:14:20 Z',
                'type': 'Create'
            }], tx1);
        await tx1.commit();
        // ======================================= Run checks against the Notifications =======================================
        // User 11 subscribes to user 1 and gets the notification when user 1 creates tracks 1, 2, 3, and playlist 1 which contains track 2
        const notifications = await models.Notification.findAll();
        assert.deepStrictEqual(notifications.length, NUM_SUBSCRIBERS);
    });
});
