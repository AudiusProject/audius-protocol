'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'blockchainUserId', {
      type: Sequelize.INTEGER,
      allowNull: true
    })
      .then(() => queryInterface.addIndex('Users', ['walletAddress']))
      .then(() => queryInterface.addIndex('Users', ['blockchainUserId']))
      .then(() => queryInterface.addColumn('Users', 'IP', {
        type: Sequelize.String,
        allowNull: true
      }))
      .then(() => queryInterface.addColumn('Users', 'timezone', {
        type: Sequelize.String,
        allowNull: true
      }))
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('Users', ['blockchainUserId'])
      .then(() => queryInterface.removeIndex('Users', ['walletAddress']))
      .then(() => queryInterface.removeColumn('Users', 'blockchainUserId'))
  }
}
