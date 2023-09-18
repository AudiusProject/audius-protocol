"use strict";
const { deviceType } = require('./constants');
const { drainMessageObject: sendAwsSns } = require('../awsSNS');
const { sendBrowserNotification, sendSafariNotification } = require('../webPush');
const racePromiseWithTimeout = require('../utils/racePromiseWithTimeout.js');
const SEND_NOTIF_TIMEOUT_MS = 20000; // 20 sec
// TODO (DM) - move this into redis
const pushNotificationQueue = {
    PUSH_NOTIFICATIONS_BUFFER: [],
    PUSH_SOLANA_NOTIFICATIONS_BUFFER: [],
    PUSH_ANNOUNCEMENTS_BUFFER: []
};
async function publish(message, userId, tx, playSound = true, title = null, types, notification) {
    await addNotificationToBuffer(message, userId, tx, pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER, playSound, title, types, notification);
}
async function publishSolanaNotification(message, userId, tx, playSound = true, title = null, types, notification) {
    await addNotificationToBuffer(message, userId, tx, pushNotificationQueue.PUSH_SOLANA_NOTIFICATIONS_BUFFER, playSound, title, types, notification);
}
async function publishAnnouncement(message, userId, tx, playSound = true, title = null) {
    await addNotificationToBuffer(message, userId, tx, pushNotificationQueue.PUSH_ANNOUNCEMENTS_BUFFER, playSound, title);
}
async function addNotificationToBuffer(message, userId, tx, buffer, playSound, title, types, notification) {
    const bufferObj = {
        userId,
        notificationParams: { message, title, playSound },
        types,
        notification
    };
    const existingEntriesCheck = buffer.filter((entry) => entry.userId === userId &&
        entry.notificationParams.message === message &&
        entry.notificationParams.title === title);
    // Ensure no dups are added
    if (existingEntriesCheck.length > 0)
        return;
    buffer.push(bufferObj);
}
/**
 * Wrapper function to call `notifFn` inside `racePromiseWithTimeout()`
 *
 * @notice swallows any error to ensure execution continues
 * @notice assumes `notifFn` always returns integer indicationg number of sent notifications
 * @returns numSentNotifs
 */
async function _sendNotification(notifFn, bufferObj, logger) {
    const logPrefix = `[notificationQueue:sendNotification] [${notifFn.name}] [userId ${bufferObj.userId}]`;
    let numSentNotifs = 0;
    try {
        const start = Date.now();
        numSentNotifs = await racePromiseWithTimeout(notifFn(bufferObj), SEND_NOTIF_TIMEOUT_MS, `Timed out in ${SEND_NOTIF_TIMEOUT_MS}ms`);
        logger.debug(`${logPrefix} Succeeded in ${Date.now() - start}ms`);
    }
    catch (e) {
        // Swallow error - log and continue
        logger.error(`${logPrefix} ERROR ${e.message}`);
    }
    return numSentNotifs || 0;
}
/**
 * Same as Promise.all(items.map(item => task(item))), but it waits for
 * the first {batchSize} promises to finish before starting the next batch.
 */
async function promiseAllInBatches(task, logger, items, batchSize) {
    let position = 0;
    let results = [];
    while (position < items.length) {
        const itemsForBatch = items.slice(position, position + batchSize);
        results = [
            ...results,
            ...(await Promise.allSettled(itemsForBatch.map((item) => task(logger, item))))
        ];
        position += batchSize;
    }
    return results;
}
async function processNotification(logger, notification) {
    let numProcessedNotifs = 0;
    if (notification.types.includes(deviceType.Mobile)) {
        const numSentNotifs = await _sendNotification(sendAwsSns, notification, logger);
        numProcessedNotifs += numSentNotifs;
    }
    if (notification.types.includes(deviceType.Browser)) {
        const numSentNotifsArr = await Promise.all([
            _sendNotification(sendBrowserNotification, notification, logger),
            _sendNotification(sendSafariNotification, notification, logger)
        ]);
        numSentNotifsArr.forEach((numSentNotifs) => {
            numProcessedNotifs += numSentNotifs;
        });
    }
    return numProcessedNotifs;
}
// Number of notitications to process in parallel
const BATCH_SIZE = 20;
async function drainPublishedMessages(logger) {
    logger.info(`[notificationQueue:drainPublishedMessages] Beginning processing of ${pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER.length} notifications...`);
    const numProcessedNotifications = await promiseAllInBatches(processNotification, logger, pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER, BATCH_SIZE);
    const numProcessedNotifs = numProcessedNotifications.reduce((total, val) => total + val, 0);
    pushNotificationQueue.PUSH_NOTIFICATIONS_BUFFER = [];
    return numProcessedNotifs;
}
async function drainPublishedSolanaMessages(logger) {
    logger.info(`[notificationQueue:drainPublishedSolanaMessages] Beginning processing of ${pushNotificationQueue.PUSH_SOLANA_NOTIFICATIONS_BUFFER.length} notifications...`);
    let numProcessedNotifs = 0;
    for (const bufferObj of pushNotificationQueue.PUSH_SOLANA_NOTIFICATIONS_BUFFER) {
        if (bufferObj.types.includes(deviceType.Mobile)) {
            const numSentNotifs = await _sendNotification(sendAwsSns, bufferObj, logger);
            numProcessedNotifs += numSentNotifs;
        }
        if (bufferObj.types.includes(deviceType.Browser)) {
            const numSentNotifsArr = await Promise.all([
                _sendNotification(sendBrowserNotification, bufferObj, logger),
                _sendNotification(sendSafariNotification, bufferObj, logger)
            ]);
            numSentNotifsArr.forEach((numSentNotifs) => {
                numProcessedNotifs += numSentNotifs;
            });
        }
    }
    pushNotificationQueue.PUSH_SOLANA_NOTIFICATIONS_BUFFER = [];
    return numProcessedNotifs;
}
async function drainPublishedAnnouncements(logger) {
    logger.info(`[notificationQueue:drainPublishedAnnouncements] Beginning processing of ${pushNotificationQueue.PUSH_SOLANA_NOTIFICATIONS_BUFFER.length} notifications...`);
    let numProcessedNotifs = 0;
    for (const bufferObj of pushNotificationQueue.PUSH_ANNOUNCEMENTS_BUFFER) {
        const numSentNotifsArr = await Promise.all([
            _sendNotification(sendAwsSns, bufferObj, logger),
            _sendNotification(sendBrowserNotification, bufferObj, logger),
            _sendNotification(sendSafariNotification, bufferObj, logger)
        ]);
        numSentNotifsArr.forEach((numSentNotifs) => {
            numProcessedNotifs += numSentNotifs;
        });
    }
    pushNotificationQueue.PUSH_ANNOUNCEMENTS_BUFFER = [];
    return numProcessedNotifs;
}
module.exports = {
    pushNotificationQueue,
    publish,
    publishSolanaNotification,
    publishAnnouncement,
    drainPublishedMessages,
    drainPublishedSolanaMessages,
    drainPublishedAnnouncements,
    processNotification,
    promiseAllInBatches,
    BATCH_SIZE
};
