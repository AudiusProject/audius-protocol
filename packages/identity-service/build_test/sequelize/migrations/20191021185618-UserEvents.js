'use strict';
const models = require('../../src/models');
module.exports = {
    up: (queryInterface, Sequelize) => {
        return queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.createTable('UserEvents', {
                walletAddress: {
                    type: Sequelize.STRING,
                    primaryKey: true,
                    references: { model: 'Users', key: 'walletAddress' }
                },
                needsRecoveryEmail: {
                    allowNull: true,
                    type: Sequelize.BOOLEAN
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
            const users = await models.User.findAll({
                attributes: ['walletAddress'],
                transaction
            });
            const toInsert = users.map(({ dataValues }) => ({
                walletAddress: dataValues.walletAddress,
                needsRecoveryEmail: true
            }));
            return models.UserEvents.bulkCreate(toInsert, { transaction });
        });
    },
    down: (queryInterface, Sequelize) => {
        return queryInterface.dropTable('UserEvents');
    }
};
