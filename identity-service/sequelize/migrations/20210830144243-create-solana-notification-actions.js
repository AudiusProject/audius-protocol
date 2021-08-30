'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('SolanaNotificationActions', {
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
          model: 'SolanaNotifications',
          key: 'id',
          as: 'notificationId'
        }
      },
      slot: {
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

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('SolanaNotificationActions')
  }
};
