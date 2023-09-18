'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('Transactions', {
            encodedABI: {
                type: Sequelize.TEXT,
                allowNull: false,
                primaryKey: true
            },
            decodedABI: {
                type: Sequelize.JSONB,
                allowNull: false
            },
            receipt: {
                type: Sequelize.JSONB,
                allowNull: false
            },
            contractRegistryKey: {
                type: Sequelize.STRING,
                allowNull: false
            },
            contractFn: {
                type: Sequelize.STRING,
                allowNull: false
            },
            contractAddress: {
                type: Sequelize.STRING,
                allowNull: false
            },
            senderAddress: {
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
        return queryInterface.dropTable('Transactions');
    }
};
