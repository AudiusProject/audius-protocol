'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('SocialHandles', {
            handle: {
                type: Sequelize.STRING,
                allowNull: false,
                primaryKey: true
            },
            twitterHandle: {
                allowNull: true,
                type: Sequelize.STRING
            },
            instagramHandle: {
                allowNull: true,
                type: Sequelize.STRING
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
        return queryInterface.dropTable('SocialHandles');
    }
};
