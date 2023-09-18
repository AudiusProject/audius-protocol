'use strict';
module.exports = (sequelize, DataTypes) => {
    const SolanaNotification = sequelize.define('SolanaNotification', {
        id: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        type: {
            type: DataTypes.ENUM({
                values: [
                    'ChallengeReward',
                    'MilestoneListen',
                    'TipSend',
                    'TipReceive',
                    'Reaction',
                    'SupporterRankUp',
                    'SupportingRankUp'
                ]
            }),
            allowNull: false
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        isHidden: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        isViewed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        entityId: {
            // Can be track/album/playlist/user id
            type: DataTypes.INTEGER,
            allowNull: true
        },
        slot: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true
        }
    }, {
        indexes: [
            {
                fields: ["((metadata->'tipTxSignature'))"],
                unique: false,
                name: 'solana_notifications_metadata_tip_tx_signature_idx'
            }
        ]
    });
    SolanaNotification.associate = function (models) {
        SolanaNotification.hasMany(models.SolanaNotificationAction, {
            sourceKey: 'id',
            foreignKey: 'notificationId',
            as: 'actions'
        });
    };
    return SolanaNotification;
};
