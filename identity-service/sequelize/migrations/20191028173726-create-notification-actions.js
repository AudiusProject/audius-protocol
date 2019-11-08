'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('NotificationActions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      notificationId: {
        type: Sequelize.UUID,
        allowNull: false,
        onDelete: 'RESTRICT',
        references: {
          model: 'Notifications',
          key: 'id',
          as: 'notificationId'
        }
      },
      blocknumber: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      actionEntityType: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      actionEntityId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('NotificationActions')
  }
}
