'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('Reactions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            slot: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            reaction: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            senderWallet: {
                type: Sequelize.STRING,
                allowNull: false
            },
            entityId: {
                type: Sequelize.STRING,
                allowNull: false
            },
            entityType: {
                type: Sequelize.STRING,
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
        return queryInterface.dropTable('Reactions');
    }
};
