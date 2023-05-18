'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn(
      'Transactions',
      'encodedABI',
      'encodedNonceAndSignature'
    )
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn(
      'Transactions',
      'encodedNonceAndSignature',
      'encodedABI'
    )
  }
}
