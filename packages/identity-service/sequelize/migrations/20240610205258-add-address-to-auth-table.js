'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Authentications', 'walletAddress', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction })
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      queryInterface.removeColumn('Authentications', 'walletAddress')
    })
  }
};
