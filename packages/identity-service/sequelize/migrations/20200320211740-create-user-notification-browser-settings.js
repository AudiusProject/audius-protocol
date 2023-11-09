'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('UserNotificationBrowserSettings', {
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      favorites: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      milestonesAndAchievements: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      reposts: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      announcements: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      followers: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
    return queryInterface.dropTable('UserNotificationBrowserSettings')
  }
}
