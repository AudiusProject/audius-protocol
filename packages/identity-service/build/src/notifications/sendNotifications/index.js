"use strict";
const models = require('../../models');
const { notificationTypes } = require('../constants');
const { fetchNotificationMetadata } = require('../fetchNotificationMetadata');
const formatNotifications = require('./formatNotification');
const publishNotifications = require('./publishNotifications');
function getUserIdsToNotify(notifications) {
    return notifications.reduce((userIds, notification) => {
        // Add user id from notification based on notification type
        switch (notification.type) {
            case notificationTypes.Follow:
                return userIds.concat(notification.metadata.followee_user_id);
            case notificationTypes.Repost.base:
                return userIds.concat(notification.metadata.entity_owner_id);
            case notificationTypes.Favorite.base:
                return userIds.concat(notification.metadata.entity_owner_id);
            case notificationTypes.RemixCreate:
                return userIds.concat(notification.metadata.remix_parent_track_user_id);
            case notificationTypes.AddTrackToPlaylist:
                return userIds.concat(notification.metadata.track_owner_id);
            case notificationTypes.ChallengeReward:
            case notificationTypes.MilestoneListen:
            case notificationTypes.TierChange:
                return userIds.concat(notification.initiator);
            case notificationTypes.Tip: {
                const receiverId = notification.initiator;
                return userIds.concat(receiverId);
            }
            case notificationTypes.Reaction:
                // Specifically handle tip reactions
                if (notification.metadata.reaction_type !== 'tip') {
                    return userIds;
                }
                // For reactions, add the tip_sender_id in the reacted_to_entity
                return userIds.concat(notification.metadata.reacted_to_entity.tip_sender_id);
            case notificationTypes.SupporterRankUp: {
                // For SupporterRankUp, need to send notifs to both supporting and supported users
                const supportingId = notification.metadata.entity_id;
                const supportedId = notification.initiator;
                return userIds.concat([supportingId, supportedId]);
            }
            case notificationTypes.SupporterDethroned:
                return userIds.concat(notification.initiator);
            default:
                return userIds;
        }
    }, []);
}
/**
 * Given an array of user ids, get the users' mobile & browser push notification settings
 * @param {Array<number>} userIdsToNotify List of user ids to retrieve the settings for
 * @param {*} tx
 */
const getUserNotificationSettings = async (userIdsToNotify, tx) => {
    const userNotificationSettings = {};
    if (userIdsToNotify.length === 0) {
        return userNotificationSettings;
    }
    // fetch user's with registered browser devices
    const userNotifSettingsMobile = await models.sequelize.query(`
      SELECT * 
      FROM "UserNotificationMobileSettings" settings
      WHERE 
        settings."userId" in (:userIds) AND 
        settings."userId" in (
          SELECT "userId"
          FROM "NotificationDeviceTokens" device
          WHERE
            device.enabled AND
            device."deviceType" in ('ios', 'android')
          )
    `, {
        replacements: {
            userIds: userIdsToNotify
        },
        model: models.UserNotificationMobileSettings,
        mapToModel: true,
        transaction: tx
    });
    // Batch fetch mobile push notifications for userIds
    userNotifSettingsMobile.forEach((settings) => {
        userNotificationSettings[settings.userId] = { mobile: settings };
    });
    // Batch fetch browser push notifications for userIds
    const userNotifBrowserPushSettings = await models.sequelize.query(`
      SELECT * 
      FROM "UserNotificationBrowserSettings" settings
      WHERE 
        settings."userId" in (:userIds) AND (
          settings."userId" in (
            SELECT "userId"
            FROM "NotificationDeviceTokens" device
            WHERE
              device.enabled AND
              device."deviceType" in ('safari')
          ) OR
          settings."userId" in (
            SELECT "userId"
            FROM "NotificationBrowserSubscriptions" device
            WHERE device.enabled
          )
        );
    `, {
        replacements: { userIds: userIdsToNotify },
        model: models.UserNotificationBrowserSettings,
        mapToModel: true,
        transaction: tx
    });
    userNotifBrowserPushSettings.forEach((settings) => {
        userNotificationSettings[settings.userId] = {
            ...(userNotificationSettings[settings.userId] || {}),
            browser: settings
        };
    });
    return userNotificationSettings;
};
/**
 * Fetches all users to send a push notification, gets their users' push notifications settings,
 * populates notifications with extra data from DP, and adds the notification to the queue
 * @param {Object} audiusLibs Instance of audius libs
 * @param {Array<Object>} notifications Array of notifications from DP
 * @param {*} tx The DB transaction to add to every DB query
 * @param {*} optimizelyClient Optimizely client for feature flags
 */
async function sendNotifications(audiusLibs, notifications, tx, optimizelyClient) {
    // Parse the notification to grab the user ids that we want to notify
    const userIdsToNotify = getUserIdsToNotify(notifications);
    // Using the userIds to notify, check the DB for their notification settings
    const userNotificationSettings = await getUserNotificationSettings(userIdsToNotify, tx);
    // Format the notifications, so that the extra information needed to build the notification is in a standard format
    const { notifications: formattedNotifications, users } = await formatNotifications(notifications, userNotificationSettings, tx, optimizelyClient);
    // Get the metadata for the notifications - users/tracks/playlists from DP that are in the notification
    const metadata = await fetchNotificationMetadata(audiusLibs, users, formattedNotifications);
    // using the metadata, populate the notifications, and push them to the publish queue
    await publishNotifications(formattedNotifications, metadata, userNotificationSettings, tx, optimizelyClient);
}
module.exports = sendNotifications;
module.exports.getUserIdsToNotify = getUserIdsToNotify;
module.exports.getUserNotificationSettings = getUserNotificationSettings;
module.exports.formatNotifications = formatNotifications;
module.exports.fetchNotificationMetadata = fetchNotificationMetadata;
