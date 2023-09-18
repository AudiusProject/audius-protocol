'use strict';
module.exports = (sequelize, DataTypes) => {
    const Reactions = sequelize.define('Reactions', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: DataTypes.INTEGER
        },
        slot: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        reactionValue: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        senderWallet: {
            type: DataTypes.STRING,
            allowNull: false
        },
        reactedTo: {
            type: DataTypes.STRING,
            allowNull: false
        },
        reactionType: {
            type: DataTypes.STRING,
            allowNull: false
        },
        createdAt: {
            allowNull: false,
            type: DataTypes.DATE
        },
        updatedAt: {
            allowNull: false,
            type: DataTypes.DATE
        }
    });
    return Reactions;
};
