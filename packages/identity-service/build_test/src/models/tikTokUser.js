'use strict';
module.exports = (sequelize, DataTypes) => {
    const TikTokUser = sequelize.define('TikTokUser', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        profile: {
            type: DataTypes.JSONB,
            allowNull: false,
            unique: false
        },
        verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        uuid: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        blockchainUserId: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        indexes: [
            {
                fields: [`((profile->>'username'))`],
                unique: false,
                name: 'tiktok_users_profile_username_idx'
            }
        ]
    });
    return TikTokUser;
};
