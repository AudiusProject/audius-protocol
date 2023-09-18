"use strict";
const models = require('../models');
const { logger } = require('../logging');
const { publishAnnouncement, drainPublishedAnnouncements } = require('./notificationQueue');
const axios = require('axios');
const config = require('../config.js');
const audiusNotificationUrl = config.get('audiusNotificationUrl');
async function pushAnnouncementNotifications() {
    const time = Date.now();
    // Read-only tx
    const tx = await models.sequelize.transaction();
    try {
        const requestUrl = `${audiusNotificationUrl}/index-mobile.json`;
        logger.info(`pushAnnouncementNotifications - ${requestUrl}`);
        const response = await axios.get(requestUrl);
        if (response.data && Array.isArray(response.data.notifications)) {
            // TODO: Worth slicing?
            for (const notif of response.data.notifications) {
                await processAnnouncement(notif, tx);
            }
        }
        // Commit
        await tx.commit();
        // Drain pending announcements
        const numProcessedNotifs = await drainPublishedAnnouncements(logger);
        logger.info(`pushAnnouncementNotifications - processed ${numProcessedNotifs} notifs in ${Date.now() - time}ms`);
    }
    catch (e) {
        logger.error(`pushAnnouncementNotifications error: ${e}`);
        await tx.rollback(); // abort the tx
    }
}
async function processAnnouncement(notif, tx) {
    if (notif.type !== 'announcement') {
        return;
    }
    const pushedNotifRecord = await models.PushedAnnouncementNotifications.findAll({
        where: {
            announcementId: notif.id
        }
    });
    const pendingNotificationPush = pushedNotifRecord.length === 0;
    if (!pendingNotificationPush) {
        return;
    }
    await _pushAnnouncement(notif, tx);
}
async function _pushAnnouncement(notif, tx) {
    const notifUrl = `${audiusNotificationUrl}/${notif.id}.json`;
    const response = await axios.get(notifUrl);
    const details = response.data;
    const msg = details.shortDescription;
    const title = details.title;
    // Push notification to all users with a valid device token at this time
    const validDeviceRecords = await models.NotificationDeviceToken.findAll({
        where: {
            enabled: true
        }
    });
    await Promise.all(validDeviceRecords.map(async (device) => {
        const userId = device.userId;
        logger.info(`Sending ${notif.id} to ${userId}`);
        await publishAnnouncement(msg, userId, tx, true, title);
    }));
    // Update database record with notification id
    await models.PushedAnnouncementNotifications.create({
        announcementId: notif.id
    });
}
module.exports = { pushAnnouncementNotifications };
