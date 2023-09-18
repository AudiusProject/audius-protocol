'use strict';
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.createTable('UserPlaylistFavorites', {
            userId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            favorites: {
                type: Sequelize.ARRAY(Sequelize.STRING),
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
        return queryInterface.dropTable('UserPlaylistFavorites');
    }
};
