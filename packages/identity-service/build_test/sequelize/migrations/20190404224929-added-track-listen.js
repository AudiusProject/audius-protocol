'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('TrackListenCounts', {
            trackId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                autoIncrement: false,
                primaryKey: true
            },
            listens: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            hour: {
                type: Sequelize.DATE,
                allowNull: false,
                primaryKey: true
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('TrackListenCounts');
    }
};
