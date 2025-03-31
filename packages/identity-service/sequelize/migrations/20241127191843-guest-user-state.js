'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'isGuest', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    })
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('Users', 'isGuest')
  }
}
