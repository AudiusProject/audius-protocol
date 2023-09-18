"use strict";
const models = require('../models');
const { logger } = require('../logging');
const { deviceType, notificationTypes, actionEntityTypes } = require('./constants');
const { publish } = require('./notificationQueue');
const { shouldNotifyUser } = require('./utils');
const { fetchNotificationMetadata } = require('./fetchNotificationMetadata');
const { notificationResponseMap, notificationResponseTitleMap, pushNotificationMessagesMap } = require('./formatNotificationMetadata');
// Base milestone list shared across all types
// Each type can be configured as needed
const baseMilestoneList = [
    10, 25, 50, 100, 250, 500, 1000, 5000, 10000, 20000, 50000, 100000, 1000000
];
const followerMilestoneList = baseMilestoneList;
// Repost milestone list shared across tracks/albums/playlists
const repostMilestoneList = baseMilestoneList;
// Favorite milestone list shared across tracks/albums/playlists
const favoriteMilestoneList = baseMilestoneList;
// Track listen milestone list
const trackListenMilestoneList = baseMilestoneList;
async function indexMilestones(milestones, owners, metadata, listenCounts, audiusLibs, tx) {
    // Index follower milestones into notifications table
    const timestamp = new Date();
    const blocknumber = metadata.max_block_number;
    // Index follower milestones
    await updateFollowerMilestones(milestones.follower_counts, blocknumber, timestamp, audiusLibs, tx);
    // Index repost milestones
    await updateRepostMilestones(milestones.repost_counts, owners, blocknumber, timestamp, audiusLibs, tx);
    // Index favorite milestones
    await updateFavoriteMilestones(milestones.favorite_counts, owners, blocknumber, timestamp, audiusLibs, tx);
}
/**
 *
 * Follower Milestones
 *
 */
async function updateFollowerMilestones(followerCounts, blocknumber, timestamp, audiusLibs, tx) {
    const followersAddedDictionary = followerCounts;
    const usersWithNewFollowers = Object.keys(followersAddedDictionary);
    const followerMilestoneNotificationType = notificationTypes.MilestoneFollow;
    // Parse follower milestones
    for (const targetUser of usersWithNewFollowers) {
        if (followersAddedDictionary.hasOwnProperty(targetUser)) {
            const currentFollowerCount = followersAddedDictionary[targetUser];
            for (let i = followerMilestoneList.length; i >= 0; i--) {
                const milestoneValue = followerMilestoneList[i];
                if (currentFollowerCount === milestoneValue) {
                    // MilestoneFollow
                    // userId=user achieving milestone
                    // entityId=milestoneValue, number of followers
                    // actionEntityType=User
                    // actionEntityId=milestoneValue, number of followers
                    await _processMilestone(followerMilestoneNotificationType, targetUser, milestoneValue, actionEntityTypes.User, milestoneValue, blocknumber, timestamp, audiusLibs, tx);
                    break;
                }
            }
        }
    }
}
/**
 *
 * Repost Milestones
 *
 */
async function updateRepostMilestones(repostCounts, owners, blocknumber, timestamp, audiusLibs, tx) {
    const tracksReposted = Object.keys(repostCounts.tracks);
    const albumsReposted = Object.keys(repostCounts.albums);
    const playlistsReposted = Object.keys(repostCounts.playlists);
    const repostMilestoneNotificationType = notificationTypes.MilestoneRepost;
    for (const repostedTrackId of tracksReposted) {
        const trackOwnerId = owners.tracks[repostedTrackId];
        const trackRepostCount = repostCounts.tracks[repostedTrackId];
        for (let i = repostMilestoneList.length; i >= 0; i--) {
            const milestoneValue = repostMilestoneList[i];
            if (trackRepostCount === milestoneValue) {
                await _processMilestone(repostMilestoneNotificationType, trackOwnerId, repostedTrackId, actionEntityTypes.Track, milestoneValue, blocknumber, timestamp, audiusLibs, tx);
                break;
            }
        }
    }
    for (const repostedAlbumId of albumsReposted) {
        const albumOwnerId = owners.albums[repostedAlbumId];
        const albumRepostCount = repostCounts.albums[repostedAlbumId];
        for (let j = repostMilestoneList.length; j >= 0; j--) {
            const milestoneValue = repostMilestoneList[j];
            if (albumRepostCount === milestoneValue) {
                await _processMilestone(repostMilestoneNotificationType, albumOwnerId, repostedAlbumId, actionEntityTypes.Album, milestoneValue, blocknumber, timestamp, audiusLibs, tx);
                break;
            }
        }
    }
    for (const repostedPlaylistId of playlistsReposted) {
        const playlistOwnerId = owners.playlists[repostedPlaylistId];
        const playlistRepostCount = repostCounts.playlists[repostedPlaylistId];
        for (let k = repostMilestoneList.length; k >= 0; k--) {
            const milestoneValue = repostMilestoneList[k];
            if (playlistRepostCount === milestoneValue) {
                await _processMilestone(repostMilestoneNotificationType, playlistOwnerId, repostedPlaylistId, actionEntityTypes.Playlist, milestoneValue, blocknumber, timestamp, audiusLibs, tx);
                break;
            }
        }
    }
}
/**
 *
 * Favorites Milestones
 *
 */
async function updateFavoriteMilestones(favoriteCounts, owners, blocknumber, timestamp, audiusLibs, tx) {
    const tracksFavorited = Object.keys(favoriteCounts.tracks);
    const albumsFavorited = Object.keys(favoriteCounts.albums);
    const playlistsFavorited = Object.keys(favoriteCounts.playlists);
    const favoriteMilestoneNotificationType = notificationTypes.MilestoneFavorite;
    for (const favoritedTrackId of tracksFavorited) {
        const trackOwnerId = owners.tracks[favoritedTrackId];
        const trackFavoriteCount = favoriteCounts.tracks[favoritedTrackId];
        for (let i = favoriteMilestoneList.length; i >= 0; i--) {
            const milestoneValue = favoriteMilestoneList[i];
            if (trackFavoriteCount === milestoneValue) {
                await _processMilestone(favoriteMilestoneNotificationType, trackOwnerId, favoritedTrackId, actionEntityTypes.Track, milestoneValue, blocknumber, timestamp, audiusLibs, tx);
                break;
            }
        }
    }
    for (const favoritedAlbumId of albumsFavorited) {
        const albumOwnerId = owners.albums[favoritedAlbumId];
        const albumFavoriteCount = favoriteCounts.albums[favoritedAlbumId];
        for (let j = favoriteMilestoneList.length; j >= 0; j--) {
            const milestoneValue = favoriteMilestoneList[j];
            if (albumFavoriteCount === milestoneValue) {
                await _processMilestone(favoriteMilestoneNotificationType, albumOwnerId, favoritedAlbumId, actionEntityTypes.Album, milestoneValue, blocknumber, timestamp, audiusLibs, tx);
                break;
            }
        }
    }
    for (const favoritedPlaylistId of playlistsFavorited) {
        const playlistOwnerId = owners.playlists[favoritedPlaylistId];
        const playlistFavoriteCount = favoriteCounts.playlists[favoritedPlaylistId];
        for (let k = favoriteMilestoneList.length; k >= 0; k--) {
            const milestoneValue = favoriteMilestoneList[k];
            if (playlistFavoriteCount === milestoneValue) {
                await _processMilestone(favoriteMilestoneNotificationType, playlistOwnerId, favoritedPlaylistId, actionEntityTypes.Playlist, milestoneValue, blocknumber, timestamp, audiusLibs, tx);
                break;
            }
        }
    }
}
/**
 *
 * Listens Milestones
 *
 */
async function updateTrackListenMilestones(listenCounts, blocknumber, timestamp, audiusLibs, tx) {
    // eslint-disable-line no-unused-vars
    const listensMilestoneNotificationType = notificationTypes.MilestoneListen;
    for (const entry of listenCounts) {
        const trackListenCount = Number.parseInt(entry.listenCount);
        for (let i = trackListenMilestoneList.length; i >= 0; i--) {
            const milestoneValue = trackListenMilestoneList[i];
            if (trackListenCount === milestoneValue ||
                (trackListenCount >= milestoneValue &&
                    trackListenCount <= milestoneValue * 1.1)) {
                const trackId = entry.trackId;
                const ownerId = entry.owner;
                await _processMilestone(listensMilestoneNotificationType, ownerId, trackId, actionEntityTypes.Track, milestoneValue, blocknumber, timestamp, audiusLibs, tx);
                break;
            }
        }
    }
}
async function _processMilestone(milestoneType, userId, entityId, entityType, milestoneValue, blocknumber, timestamp, audiusLibs, tx) {
    // Skip notification based on user configuration
    const { notifyMobile, notifyBrowserPush } = await shouldNotifyUser(userId, 'milestonesAndAchievements');
    let newMilestone = false;
    const existingMilestoneQuery = await models.Notification.findAll({
        where: {
            userId: userId,
            type: milestoneType,
            entityId: entityId
        },
        include: [
            {
                model: models.NotificationAction,
                as: 'actions',
                where: {
                    actionEntityType: entityType,
                    actionEntityId: milestoneValue
                }
            }
        ],
        transaction: tx
    });
    if (existingMilestoneQuery.length === 0) {
        newMilestone = true;
        // MilestoneListen/Favorite/Repost
        // userId=user achieving milestone
        // entityId=Entity reaching milestone, one of track/collection
        // actionEntityType=Entity achieving milestone, can be track/collection
        // actionEntityId=Milestone achieved
        const createMilestoneTx = await models.Notification.create({
            userId: userId,
            type: milestoneType,
            entityId: entityId,
            blocknumber,
            timestamp
        }, { transaction: tx });
        const notificationId = createMilestoneTx.id;
        const notificationAction = await models.NotificationAction.findOne({
            where: {
                notificationId,
                actionEntityType: entityType,
                actionEntityId: milestoneValue,
                blocknumber
            },
            transaction: tx
        });
        if (notificationAction == null) {
            await models.NotificationAction.create({
                notificationId,
                actionEntityType: entityType,
                actionEntityId: milestoneValue,
                blocknumber
            }, {
                transaction: tx
            });
        }
        logger.info(`processMilestone - Process milestone ${userId}, type ${milestoneType}, entityId ${entityId}, type ${entityType}, milestoneValue ${milestoneValue}`);
        // Destroy any unread milestone notifications of this type + entity
        const milestonesToBeDeleted = await models.Notification.findAll({
            where: {
                userId: userId,
                type: milestoneType,
                entityId: entityId,
                isRead: false
            },
            include: [
                {
                    model: models.NotificationAction,
                    as: 'actions',
                    where: {
                        actionEntityType: entityType,
                        actionEntityId: {
                            [models.Sequelize.Op.not]: milestoneValue
                        }
                    }
                }
            ]
        });
        if (milestonesToBeDeleted) {
            for (const milestoneToDelete of milestonesToBeDeleted) {
                logger.info(`Deleting milestone: ${milestoneToDelete.id}`);
                let destroyTx = await models.NotificationAction.destroy({
                    where: {
                        notificationId: milestoneToDelete.id
                    },
                    transaction: tx
                });
                logger.info(destroyTx);
                destroyTx = await models.Notification.destroy({
                    where: {
                        id: milestoneToDelete.id
                    },
                    transaction: tx
                });
                logger.info(destroyTx);
            }
        }
    }
    // Only send a milestone push notification on the first insert to the DB
    if ((notifyMobile || notifyBrowserPush) && newMilestone) {
        const notifStub = {
            userId: userId,
            type: milestoneType,
            entityId: entityId,
            blocknumber,
            timestamp,
            actions: [
                {
                    actionEntityType: entityType,
                    actionEntityId: milestoneValue,
                    blocknumber
                }
            ]
        };
        const metadata = await fetchNotificationMetadata(audiusLibs, [milestoneValue], [notifStub]);
        const mapNotification = notificationResponseMap[milestoneType];
        try {
            const msgGenNotif = {
                ...notifStub,
                ...mapNotification(notifStub, metadata)
            };
            logger.debug('processMilestone - About to generate message for milestones push notification', msgGenNotif, metadata);
            const msg = pushNotificationMessagesMap[notificationTypes.Milestone](msgGenNotif);
            logger.debug(`processMilestone - message: ${msg}`);
            const title = notificationResponseTitleMap[notificationTypes.Milestone]();
            const types = [];
            if (notifyMobile)
                types.push(deviceType.Mobile);
            if (notifyBrowserPush)
                types.push(deviceType.Browser);
            await publish(msg, userId, tx, true, title, types);
        }
        catch (e) {
            // Log on error instead of failing
            logger.info(`Error adding push notification to buffer: ${e}. notifStub ${JSON.stringify(notifStub)}`);
        }
    }
}
module.exports = {
    indexMilestones
};
