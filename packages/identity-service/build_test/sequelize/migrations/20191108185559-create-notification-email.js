'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('NotificationEmails', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            userId: {
                type: Sequelize.INTEGER
            },
            timestamp: {
                type: Sequelize.DATE,
                primaryKey: true
            },
            emailFrequency: {
                allowNull: false,
                type: Sequelize.ENUM('daily', 'weekly', 'off'),
                defaultValue: 'daily'
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
        return queryInterface.dropTable('NotificationEmails');
    }
};
