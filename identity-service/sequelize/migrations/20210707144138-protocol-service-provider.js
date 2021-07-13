'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('ProtocolServiceProviders', {
      wallet: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
      },
      minimumDelegationAmount: {
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
    })
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('ProtocolServiceProviders')
  }
};
