'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('PushNotificationBadgeCounts', {
            userId: {
                type: Sequelize.INTEGER,
                primaryKey: true
            },
            iosBadgeCount: {
                type: Sequelize.INTEGER
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
        return queryInterface.dropTable('PushNotificationBadgeCounts');
    }
};
