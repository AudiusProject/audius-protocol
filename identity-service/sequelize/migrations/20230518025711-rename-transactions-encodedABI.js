'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn(
      'Transactions',
      'encodedABI',
      'encodedNonceAndSig'
    )
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn(
      'Transactions',
      'encodedNonceAndSig',
      'encodedABI'
    )
  }
}
