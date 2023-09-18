"use strict";
const models = require('../../models');
const { bulkGetSubscribersFromDiscovery, shouldReadSubscribersFromDiscovery } = require('../utils');
const { logger } = require('../../logging');
const { notificationTypes, actionEntityTypes } = require('../constants');
const notificationUtils = require('./utils');
const shouldNotifyUser = (userId, prop, settings) => {
    const userNotification = { notifyMobile: false, notifyBrowserPush: false };
    if (!(userId in settings))
        return userNotification;
    if ('mobile' in settings[userId]) {
        userNotification.mobile = settings[userId].mobile[prop];
    }
    if ('browser' in settings[userId]) {
        userNotification.browser = settings[userId].browser[prop];
    }
    return userNotification;
};
const getRepostType = (type) => {
    switch (type) {
        case 'track':
            return notificationTypes.Repost.track;
        case 'album':
            return notificationTypes.Repost.album;
        case 'playlist':
            return notificationTypes.Repost.playlist;
        default:
            return '';
    }
};
const getFavoriteType = (type) => {
    switch (type) {
        case 'track':
            return notificationTypes.Favorite.track;
        case 'album':
            return notificationTypes.Favorite.album;
        case 'playlist':
            return notificationTypes.Favorite.playlist;
        default:
            return '';
    }
};
let subscriberPushNotifications = [];
async function formatNotifications(notifications, notificationSettings, tx, optimizelyClient) {
    // If READ_SUBSCRIBERS_FROM_DISCOVERY_ENABLED is enabled, bulk fetch all subscriber IDs
    // from discovery for the initiators of create notifications.
    const readSubscribersFromDiscovery = shouldReadSubscribersFromDiscovery(optimizelyClient);
    let userSubscribersMap = {};
    if (readSubscribersFromDiscovery) {
        const userIds = new Set(notifications.reduce((filtered, notif) => {
            if (notif.type === notificationTypes.Create.base) {
                filtered.push(notif.initiator);
            }
            return filtered;
        }, []));
        if (userIds.size > 0) {
            userSubscribersMap = await bulkGetSubscribersFromDiscovery(userIds);
        }
    }
    // Loop through notifications to get the formatted notification
    const formattedNotifications = [];
    for (const notif of notifications) {
        // blocknumber parsed for all notification types
        const blocknumber = notif.blocknumber;
        // Handle the 'follow' notification type
        if (notif.type === notificationTypes.Follow) {
            const notificationTarget = notif.metadata.followee_user_id;
            const shouldNotify = shouldNotifyUser(notificationTarget, 'followers', notificationSettings);
            if (shouldNotify.mobile || shouldNotify.browser) {
                const formattedFollow = {
                    ...notif,
                    actions: [
                        {
                            actionEntityType: actionEntityTypes.User,
                            actionEntityId: notif.metadata.follower_user_id,
                            blocknumber
                        }
                    ]
                };
                formattedNotifications.push(formattedFollow);
            }
        }
        // Handle the 'repost' notification type
        // track/album/playlist
        if (notif.type === notificationTypes.Repost.base) {
            const notificationTarget = notif.metadata.entity_owner_id;
            const shouldNotify = shouldNotifyUser(notificationTarget, 'reposts', notificationSettings);
            if (shouldNotify.mobile || shouldNotify.browser) {
                const formattedRepost = {
                    ...notif,
                    actions: [
                        {
                            actionEntityType: actionEntityTypes.User,
                            actionEntityId: notif.initiator,
                            blocknumber
                        }
                    ],
                    entityId: notif.metadata.entity_id,
                    // we're going to overwrite this property so fetchNotificationMetadata can use it
                    type: getRepostType(notif.metadata.entity_type)
                };
                formattedNotifications.push(formattedRepost);
            }
        }
        // Handle the 'favorite' notification type, track/album/playlist
        if (notif.type === notificationTypes.Favorite.base) {
            const notificationTarget = notif.metadata.entity_owner_id;
            const shouldNotify = shouldNotifyUser(notificationTarget, 'favorites', notificationSettings);
            if (shouldNotify.mobile || shouldNotify.browser) {
                const formattedFavorite = {
                    ...notif,
                    actions: [
                        {
                            actionEntityType: actionEntityTypes.User,
                            actionEntityId: notif.initiator,
                            blocknumber
                        }
                    ],
                    entityId: notif.metadata.entity_id,
                    // we're going to overwrite this property so fetchNotificationMetadata can use it
                    type: getFavoriteType(notif.metadata.entity_type)
                };
                formattedNotifications.push(formattedFavorite);
            }
        }
        // Handle the 'remix create' notification type
        if (notif.type === notificationTypes.RemixCreate) {
            const notificationTarget = notif.metadata.remix_parent_track_user_id;
            const shouldNotify = shouldNotifyUser(notificationTarget, 'remixes', notificationSettings);
            if (shouldNotify.mobile || shouldNotify.browser) {
                const formattedRemixCreate = {
                    ...notif,
                    actions: [
                        {
                            actionEntityType: actionEntityTypes.User,
                            actionEntityId: notif.metadata.remix_parent_track_user_id,
                            blocknumber
                        },
                        {
                            actionEntityType: actionEntityTypes.Track,
                            actionEntityId: notif.metadata.entity_id,
                            blocknumber
                        },
                        {
                            actionEntityType: actionEntityTypes.Track,
                            actionEntityId: notif.metadata.remix_parent_track_id,
                            blocknumber
                        }
                    ],
                    entityId: notif.metadata.entity_id,
                    type: notificationTypes.RemixCreate
                };
                formattedNotifications.push(formattedRemixCreate);
            }
        }
        // Handle the remix cosign notification type
        if (notif.type === notificationTypes.RemixCosign) {
            const formattedRemixCosign = {
                ...notif,
                entityId: notif.metadata.entity_id,
                actions: [
                    {
                        actionEntityType: actionEntityTypes.User,
                        actionEntityId: notif.initiator,
                        blocknumber
                    },
                    {
                        actionEntityType: actionEntityTypes.Track,
                        actionEntityId: notif.metadata.entity_id,
                        blocknumber
                    }
                ],
                type: notificationTypes.RemixCosign
            };
            formattedNotifications.push(formattedRemixCosign);
        }
        // Handle 'challenge reward' notification type
        if (notif.type === notificationTypes.ChallengeReward) {
            const formattedRewardNotification = {
                ...notif,
                challengeId: notif.metadata.challenge_id,
                actions: [
                    {
                        actionEntityType: notif.metadata.challenge_id,
                        actionEntityId: notif.initiator,
                        slot: notif.slot
                    }
                ],
                type: notificationTypes.ChallengeReward
            };
            formattedNotifications.push(formattedRewardNotification);
        }
        // Handle 'listen milestone' notification type
        if (notif.type === notificationTypes.MilestoneListen) {
            const notificationTarget = notif.initiator;
            const shouldNotify = shouldNotifyUser(notificationTarget, 'milestonesAndAchievements', notificationSettings);
            if (shouldNotify.mobile || shouldNotify.browser) {
                const formattedListenMilstoneNotification = {
                    ...notif,
                    entityId: notif.metadata.entity_id,
                    type: notificationTypes.MilestoneListen,
                    actions: [
                        {
                            actionEntityType: actionEntityTypes.Track,
                            actionEntityId: notif.metadata.threshold
                        }
                    ]
                };
                formattedNotifications.push(formattedListenMilstoneNotification);
            }
        }
        // Handle 'tier change' notification type
        if (notif.type === notificationTypes.TierChange) {
            const formattedTierChangeNotification = {
                ...notif,
                tier: notif.metadata.tier,
                actions: [
                    {
                        actionEntityType: actionEntityTypes.User,
                        actionEntityId: notif.initiator,
                        blocknumber
                    }
                ],
                type: notificationTypes.TierChange
            };
            formattedNotifications.push(formattedTierChangeNotification);
        }
        // Handle the 'create' notification type, track/album/playlist
        if (notif.type === notificationTypes.Create.base) {
            const subscribers = userSubscribersMap[notif.initiator] || [];
            await _processCreateNotifications(notif, tx, readSubscribersFromDiscovery, subscribers);
        }
        // Handle the 'track added to playlist' notification type
        if (notif.type === notificationTypes.AddTrackToPlaylist) {
            const formattedAddTrackToPlaylistNotification = {
                ...notif,
                actions: [
                    {
                        actionEntityType: actionEntityTypes.Track,
                        actionTrackId: notif.metadata.track_id,
                        blocknumber
                    }
                ],
                metadata: {
                    trackOwnerId: notif.metadata.track_owner_id,
                    playlistOwnerId: notif.initiator,
                    playlistId: notif.metadata.playlist_id
                },
                entityId: notif.metadata.track_id,
                type: notificationTypes.AddTrackToPlaylist
            };
            formattedNotifications.push(formattedAddTrackToPlaylistNotification);
        }
        if (notif.type === notificationTypes.Reaction) {
            const formattedReactionNotification = {
                ...notif
            };
            formattedNotifications.push(formattedReactionNotification);
        }
        if (notif.type === notificationTypes.SupporterRankUp) {
            // Need to create two notifs
            const supportingRankUp = {
                ...notif,
                type: notificationTypes.SupportingRankUp
            };
            const supporterRankUp = {
                ...notif,
                type: notificationTypes.SupporterRankUp
            };
            formattedNotifications.push(supportingRankUp);
            formattedNotifications.push(supporterRankUp);
        }
        if (notif.type === notificationTypes.Tip) {
            // For tip, need sender userId, and amount
            const formattedTipNotification = {
                ...notif,
                type: notificationTypes.TipReceive
            };
            formattedNotifications.push(formattedTipNotification);
        }
        if (notif.type === notificationTypes.SupporterDethroned) {
            formattedNotifications.push({ ...notif });
        }
    }
    const [formattedCreateNotifications, users] = await _processSubscriberPushNotifications();
    formattedNotifications.push(...formattedCreateNotifications);
    return { notifications: formattedNotifications, users: [...users] };
}
async function _processSubscriberPushNotifications() {
    const filteredFormattedCreateNotifications = [];
    const users = [];
    const currentTime = Date.now();
    for (let i = 0; i < subscriberPushNotifications.length; i++) {
        const entry = subscriberPushNotifications[i];
        const timeSince = currentTime - entry.time;
        if (timeSince > notificationUtils.getPendingCreateDedupeMs()) {
            filteredFormattedCreateNotifications.push(entry);
            users.push(entry.initiator);
            entry.pending = false;
        }
    }
    subscriberPushNotifications = subscriberPushNotifications.filter((x) => x.pending);
    return [filteredFormattedCreateNotifications, users];
}
async function _processCreateNotifications(notif, tx, readSubscribersFromDiscovery, subscribersFromDiscovery) {
    const blocknumber = notif.blocknumber;
    let createType = null;
    let actionEntityType = null;
    switch (notif.metadata.entity_type) {
        case 'track':
            createType = notificationTypes.Create.track;
            actionEntityType = actionEntityTypes.Track;
            break;
        case 'album':
            createType = notificationTypes.Create.album;
            actionEntityType = actionEntityTypes.User;
            break;
        case 'playlist':
            createType = notificationTypes.Create.playlist;
            actionEntityType = actionEntityTypes.User;
            break;
        default:
            throw new Error('Invalid create type');
    }
    // If the initiator is the main audius account, skip the notification
    // NOTE: This is a temp fix to not stall identity service
    if (notif.initiator === 51) {
        return [];
    }
    if (actionEntityType === actionEntityTypes.Track) {
        return [];
    }
    // Notifications go to all users subscribing to this track uploader
    let subscribers = subscribersFromDiscovery;
    if (!readSubscribersFromDiscovery) {
        // Query user IDs from subscriptions table
        subscribers = await models.Subscription.findAll({
            where: {
                userId: notif.initiator
            },
            transaction: tx
        });
    }
    // No operation if no users subscribe to this creator
    if (subscribers.length === 0) {
        return [];
    }
    // The notification entity id is the uploader id for tracks
    // Each track will added to the notification actions table
    // For playlist/albums, the notification entity id is the collection id itself
    const notificationEntityId = actionEntityType === actionEntityTypes.Track
        ? notif.initiator
        : notif.metadata.entity_id;
    // Action table entity is trackId for CreateTrack notifications
    // Allowing multiple track creates to be associated w/ a single notif for your subscription
    // For collections, the entity is the owner id, producing a distinct notif for each
    const createdActionEntityId = actionEntityType === actionEntityTypes.Track
        ? notif.metadata.entity_id
        : notif.metadata.entity_owner_id;
    // Create notification for each subscriber
    const formattedNotifications = subscribers.map((s) => {
        // send push notification to each subscriber
        return {
            ...notif,
            actions: [
                {
                    actionEntityType: actionEntityType,
                    actionEntityId: createdActionEntityId,
                    blocknumber
                }
            ],
            entityId: notificationEntityId,
            time: Date.now(),
            pending: true,
            // Add notification for this user indicating the uploader has added a track
            subscriberId: readSubscribersFromDiscovery ? s : s.subscriberId,
            // we're going to overwrite this property so fetchNotificationMetadata can use it
            type: createType
        };
    });
    subscriberPushNotifications.push(...formattedNotifications);
    // Dedupe album /playlist notification
    if (createType === notificationTypes.Create.album ||
        createType === notificationTypes.Create.playlist) {
        const trackIdObjectList = notif.metadata.collection_content.track_ids;
        const trackIdsArray = trackIdObjectList.map((x) => x.track);
        if (trackIdObjectList.length > 0) {
            // Clear duplicate push notifications in local queue
            let dupeFound = false;
            for (let i = 0; i < subscriberPushNotifications.length; i++) {
                const pushNotif = subscriberPushNotifications[i];
                const type = pushNotif.type;
                if (type === notificationTypes.Create.track) {
                    const pushActionEntityId = pushNotif.metadata.entity_id;
                    // Check if this pending notification includes a duplicate track
                    if (trackIdsArray.includes(pushActionEntityId)) {
                        logger.debug(`Found dupe push notif ${type}, trackId: ${pushActionEntityId}`);
                        dupeFound = true;
                        subscriberPushNotifications[i].pending = false;
                    }
                }
            }
            if (dupeFound) {
                subscriberPushNotifications = subscriberPushNotifications.filter((x) => x.pending);
            }
        }
    }
}
module.exports = formatNotifications;
