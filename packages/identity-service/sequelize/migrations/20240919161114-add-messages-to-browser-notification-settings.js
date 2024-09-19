'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'UserNotificationBrowserSettings',
      'comments',
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    )
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'UserNotificationBrowserSettings',
      'comments'
    )
  }
}
