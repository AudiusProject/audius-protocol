'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addIndex('SolanaNotifications', ['userId'], { transaction })
      await queryInterface.addIndex('SolanaNotificationActions', ['slot'], { transaction })
      await queryInterface.addIndex('SolanaNotificationActions', ['notificationId'], { transaction })
      await queryInterface.addIndex('SolanaNotificationActions', ['notificationId', 'actionEntityType', 'actionEntityId', 'slot'], { transaction })
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('SolanaNotifications', ['userId'])
      .then(() => queryInterface.removeIndex('SolanaNotificationActions', ['slot']))
      .then(() => queryInterface.removeIndex('SolanaNotificationActions', ['notificationId']))
      .then(() => queryInterface.removeIndex('SolanaNotificationActions', ['notificationId', 'actionEntityType', 'actionEntityId', 'slot']))
  }
}
