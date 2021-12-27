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
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('SolanaNotifications', ['userId'], {transaction})
      await queryInterface.removeIndex('SolanaNotificationActions', ['slot'], {transaction})
      await queryInterface.removeIndex('SolanaNotificationActions', ['notificationId'], {transaction})
      await queryInterface.removeIndex('SolanaNotificationActions', ['notificationId', 'actionEntityType', 'actionEntityId', 'slot'], {transaction})
    })
  }
}
