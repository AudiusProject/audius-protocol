"use strict";
const axios = require('axios');
const moment = require('moment');
const { sampleSize, isEqual } = require('lodash');
const models = require('../models');
const { logger } = require('../logging');
const { deviceType, notificationTypes } = require('./constants');
const { publish } = require('./notificationQueue');
const { decodeHashId, shouldNotifyUser } = require('./utils');
const { fetchNotificationMetadata } = require('./fetchNotificationMetadata');
const { notificationResponseMap, notificationResponseTitleMap, pushNotificationMessagesMap } = require('./formatNotificationMetadata');
const audiusLibsWrapper = require('../audiusLibsInstance');
const { getRemoteVar, REMOTE_VARS } = require('../remoteConfig');
const TRENDING_TIME = Object.freeze({
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year'
});
const TRENDING_GENRE = Object.freeze({
    ALL: 'all'
});
const getTimeGenreActionType = (time, genre) => `${time}:${genre}`;
// The minimum time in hrs between notifications
const TRENDING_INTERVAL_HOURS = 3;
// The highest rank for which a notification will be sent
const MAX_TOP_TRACK_RANK = 10;
// The number of discovery nodes to test and verify that trending
// is consistent
const NUM_DISCOVERY_NODES_FOR_CONSENSUS = 3;
let SELECTED_DISCOVERY_NODES = null;
setInterval(async () => {
    SELECTED_DISCOVERY_NODES = await getDiscoveryNodes();
}, 5 * 60 * 60 /* re-run on the 5-minute */);
const getDiscoveryNodes = async () => {
    const libs = await audiusLibsWrapper.getAudiusLibsAsync();
    const discoveryNodes = await libs.discoveryProvider.serviceSelector.findAll();
    logger.debug(`Updating discovery nodes for trendingTrackProcessing to ${discoveryNodes}`);
    return sampleSize(discoveryNodes, NUM_DISCOVERY_NODES_FOR_CONSENSUS);
};
async function getTrendingTracks(trendingExperiment, discoveryNodes) {
    const results = await Promise.all(discoveryNodes.map(async (discoveryNode) => {
        try {
            // The owner info is then used to target listenCount milestone notifications
            const params = new URLSearchParams();
            params.append('time', TRENDING_TIME.WEEK);
            params.append('limit', MAX_TOP_TRACK_RANK);
            const baseUrl = `${discoveryNode}/v1/full/tracks/trending`;
            const url = trendingExperiment
                ? `${baseUrl}/${trendingExperiment}`
                : `${baseUrl}`;
            const trendingTracksResponse = await axios({
                method: 'get',
                url,
                params,
                timeout: 10000
            });
            const trendingTracks = trendingTracksResponse.data.data.map((track, idx) => ({
                trackId: decodeHashId(track.id),
                rank: idx + 1,
                userId: decodeHashId(track.user.id)
            }));
            const blocknumber = trendingTracksResponse.data.latest_indexed_block;
            return { trendingTracks, blocknumber };
        }
        catch (err) {
            logger.error(`Unable to fetch trending tracks: ${err}`);
            return null;
        }
    }));
    // Make sure we had no errors
    if (results.some((res) => res === null)) {
        logger.error(`Unable to fetch trending tracks from all nodes`);
        return null;
    }
    // Make sure trending is consistent between nodes
    const { trendingTracks, blocknumber } = results[0];
    for (const result of results.slice(1)) {
        const { trendingTracks: otherTrendingTracks } = result;
        if (!isEqual(trendingTracks, otherTrendingTracks)) {
            const ids = trendingTracks.map((t) => t.trackId);
            const otherIds = otherTrendingTracks.map((t) => t.trackId);
            logger.error(`Trending results diverged ${ids} versus ${otherIds}`);
            return null;
        }
    }
    logger.debug(`Trending results converged with ${trendingTracks.map((t) => t.trackId)}`);
    return { trendingTracks, blocknumber };
}
/**
 * For each of the trending tracks
 * check if the track meets the constraints to become a notification
 *   - If the trending track was not already created in the past 3 hrs
 *   - The trending track should be new or move up in rank ie. from rank 4 => rank 1
 * Insert the notification and notificationAction into the DB
 * Check the user's notification settings, and if enabled, send a push notification
 * @param {AudiusLibs} audiusLibs Audius Libs instance
 * @param {number} blocknumber Blocknumber of the discovery provider
 * @param {Array<{ trackId: number, rank: number, userId: number }>} trendingTracks Array of the trending tracks
 * @param {*} tx DB transaction
 */
async function processTrendingTracks(audiusLibs, blocknumber, trendingTracks, tx) {
    const now = moment();
    for (let idx = 0; idx < trendingTracks.length; idx += 1) {
        const { rank, trackId, userId } = trendingTracks[idx];
        const { notifyMobile, notifyBrowserPush } = await shouldNotifyUser(userId, 'milestonesAndAchievements');
        // Check if the notification was previously created
        const existingTrendingTracks = await models.Notification.findAll({
            where: {
                userId: userId,
                type: notificationTypes.TrendingTrack,
                entityId: trackId
            },
            include: [
                {
                    model: models.NotificationAction,
                    as: 'actions'
                }
            ],
            order: [['timestamp', 'DESC']],
            limit: 1,
            transaction: tx
        });
        if (existingTrendingTracks.length > 0) {
            const previousRank = existingTrendingTracks[0].actions[0].actionEntityId;
            const previousCreated = moment(existingTrendingTracks[0].timestamp);
            const duration = moment.duration(now.diff(previousCreated)).asHours();
            // If the user was notified of the trending track within the last TRENDING_INTERVAL_HOURS skip
            // If the new rank is not less than the old rank, skip
            //   ie. Skip if track moved from #2 trending to #3 trending or stayed the same
            if (duration < TRENDING_INTERVAL_HOURS || previousRank <= rank) {
                // Skip the insertion of the notification into the DB
                // This trending track does not meet the constraints
                continue;
            }
        }
        const actionEntityType = getTimeGenreActionType(TRENDING_TIME.WEEK, TRENDING_GENRE.ALL);
        const trendingTrackNotification = await models.Notification.create({
            userId: userId,
            type: notificationTypes.TrendingTrack,
            entityId: trackId,
            blocknumber,
            timestamp: now
        }, { transaction: tx });
        const notificationId = trendingTrackNotification.id;
        await models.NotificationAction.create({
            notificationId,
            actionEntityType,
            actionEntityId: rank,
            blocknumber
        }, { transaction: tx });
        if (notifyMobile || notifyBrowserPush) {
            const notifStub = {
                userId: userId,
                type: notificationTypes.TrendingTrack,
                entityId: trackId,
                blocknumber,
                timestamp: now,
                actions: [
                    {
                        actionEntityType,
                        actionEntityId: rank,
                        blocknumber
                    }
                ]
            };
            const metadata = await fetchNotificationMetadata(audiusLibs, [], [notifStub]);
            const mapNotification = notificationResponseMap[notificationTypes.TrendingTrack];
            try {
                const msgGenNotif = {
                    ...notifStub,
                    ...mapNotification(notifStub, metadata)
                };
                logger.debug('processTrendingTrack - About to generate message for trending track milestone push notification', msgGenNotif, metadata);
                const msg = pushNotificationMessagesMap[notificationTypes.TrendingTrack](msgGenNotif);
                logger.debug(`processTrendingTrack - message: ${msg}`);
                const title = notificationResponseTitleMap[notificationTypes.TrendingTrack]();
                const types = [];
                if (notifyMobile)
                    types.push(deviceType.Mobile);
                if (notifyBrowserPush)
                    types.push(deviceType.Browser);
                await publish(msg, userId, tx, true, title, types);
            }
            catch (e) {
                // Log on error instead of failing
                logger.error(`Error adding trending track push notification to buffer: ${e}. ${JSON.stringify({ rank, trackId, userId })}`);
            }
        }
    }
}
async function indexTrendingTracks(audiusLibs, optimizelyClient, tx) {
    try {
        const trendingExperiment = getRemoteVar(optimizelyClient, REMOTE_VARS.TRENDING_EXPERIMENT);
        if (!SELECTED_DISCOVERY_NODES)
            return;
        const { trendingTracks, blocknumber } = await getTrendingTracks(trendingExperiment, SELECTED_DISCOVERY_NODES);
        await processTrendingTracks(audiusLibs, blocknumber, trendingTracks, tx);
    }
    catch (err) {
        logger.error(`Unable to process trending track notifications: ${err.message}`);
    }
}
module.exports = {
    TRENDING_TIME,
    TRENDING_GENRE,
    getTimeGenreActionType,
    indexTrendingTracks,
    getTrendingTracks,
    processTrendingTracks
};
