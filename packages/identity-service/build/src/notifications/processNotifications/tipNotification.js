"use strict";
const models = require('../../models');
const { notificationTypes } = require('../constants');
async function processTipNotifications(notifications, tx) {
    for (const notification of notifications) {
        const { slot, initiator: receiverId, metadata: { amount, entity_id: senderId, tx_signature: tipTxSignature } } = notification;
        const senderNotification = await models.SolanaNotification.findOne({
            where: {
                slot,
                type: notificationTypes.TipSend,
                userId: senderId,
                entityId: receiverId,
                metadata: {
                    tipTxSignature,
                    amount
                }
            },
            transaction: tx
        });
        if (senderNotification == null) {
            // Create the sender notif
            await models.SolanaNotification.create({
                slot,
                type: notificationTypes.TipSend,
                userId: senderId,
                entityId: receiverId,
                metadata: {
                    tipTxSignature,
                    amount
                }
            }, {
                transaction: tx
            });
        }
        const receiverNotification = await models.SolanaNotification.findOne({
            where: {
                slot,
                type: notificationTypes.TipReceive,
                userId: receiverId,
                entityId: senderId,
                metadata: {
                    tipTxSignature,
                    amount
                }
            },
            transaction: tx
        });
        if (receiverNotification == null) {
            // Create the receiver notif
            await models.SolanaNotification.create({
                slot,
                type: notificationTypes.TipReceive,
                userId: receiverId,
                entityId: senderId,
                metadata: {
                    tipTxSignature,
                    amount
                }
            }, {
                transaction: tx
            });
        }
    }
    return notifications;
}
module.exports = processTipNotifications;
