'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addIndex('Users', ['email'])
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('Users', ['email'])
  }
}
