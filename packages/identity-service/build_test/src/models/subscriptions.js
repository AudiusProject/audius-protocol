'use strict';
module.exports = (sequelize, DataTypes) => {
    const Subscriptions = sequelize.define('Subscription', {
        subscriberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        }
    }, {});
    return Subscriptions;
};
