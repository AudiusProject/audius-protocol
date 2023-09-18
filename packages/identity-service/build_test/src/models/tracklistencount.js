'use strict';
module.exports = (sequelize, DataTypes) => {
    const TrackListenCount = sequelize.define('TrackListenCount', {
        trackId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: false,
            primaryKey: true
        },
        listens: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        hour: {
            type: DataTypes.DATE,
            allowNull: false,
            primaryKey: true
        }
    }, {});
    TrackListenCount.associate = function (models) {
        // associations can be defined here
    };
    return TrackListenCount;
};
