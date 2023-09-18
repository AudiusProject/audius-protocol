'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('Users', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false
            },
            handle: {
                type: Sequelize.STRING,
                allowNull: true
            },
            ownerWallet: {
                type: Sequelize.STRING,
                allowNull: true
            },
            isConfigured: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            lastSeenDate: {
                type: Sequelize.DATE,
                allowNull: false
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
        return queryInterface.dropTable('Users');
    }
};
