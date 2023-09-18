"use strict";
const moment = require('moment');
const models = require('../../models');
const { notificationTypes, actionEntityTypes } = require('../constants');
/**
 * Process tier change notifications, note these notifications do not "stack" meaning that
 * a notification action will never reference a previously created notification
 * @param {Array<Object>} notifications
 * @param {*} tx The DB transaction to attach to DB requests
 */
async function processTierChangeNotifications(notifications, tx) {
    for (const notification of notifications) {
        const { tier } = notification.metadata;
        // Create/Find a Notification and NotificationAction for this event
        // NOTE: TierChange Notifications do NOT stack. A new notification is created for each tier change
        const blocknumber = notification.blocknumber;
        const timestamp = Date.parse(notification.timestamp.slice(0, -2));
        const momentTimestamp = moment(timestamp);
        const updatedTimestamp = momentTimestamp
            .add(1, 's')
            .format('YYYY-MM-DD HH:mm:ss');
        let notificationObj = await models.Notification.findOne({
            where: {
                blocknumber,
                tier,
                timestamp: updatedTimestamp,
                type: notificationTypes.TierChange,
                userId: notification.initiator
            },
            transaction: tx
        });
        if (notificationObj == null) {
            notificationObj = await models.Notification.create({
                blocknumber,
                tier,
                timestamp: updatedTimestamp,
                type: notificationTypes.TierChange,
                userId: notification.initiator
            }, {
                transaction: tx
            });
        }
        const notificationAction = await models.NotificationAction.findOne({
            where: {
                notificationId: notificationObj.id,
                actionEntityType: actionEntityTypes.User,
                actionEntityId: notification.initiator,
                blocknumber
            },
            transaction: tx
        });
        if (notificationAction == null) {
            await models.NotificationAction.create({
                notificationId: notificationObj.id,
                actionEntityType: actionEntityTypes.User,
                actionEntityId: notification.initiator,
                blocknumber
            }, {
                transaction: tx
            });
        }
    }
    return notifications;
}
module.exports = processTierChangeNotifications;
