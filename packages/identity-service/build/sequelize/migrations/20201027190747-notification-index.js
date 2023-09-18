'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addIndex('NotificationActions', [
            'notificationId',
            'actionEntityType',
            'actionEntityId',
            'blocknumber'
        ]);
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex('NotificationActions', [
            'notificationId',
            'actionEntityType',
            'actionEntityId',
            'blocknumber'
        ]);
    }
};
