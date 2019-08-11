'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Users', 'ownerWallet', 'walletAddress')
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn('Users', 'walletAddress', 'ownerWallet')
  }
}
