'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const userNotificationSettingsMobilePromise = queryInterface.createTable('UserNotificationSettingsMobile', {
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

    const notificationDeviceTokensPromise = queryInterface.createTable('notificationDeviceTokens', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      deviceToken: {
        type: Sequelize.STRING,
        allowNull: false
      },
      deviceType: {
        type: Sequelize.ENUM({
          values: [
            'ios',
            'android'
          ]
        }),
        allowNull: false
      },
      awsARN: {
        type: Sequelize.STRING,
        allowNull: true
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    })

    return Promise.all([
      userNotificationSettingsMobilePromise,
      notificationDeviceTokensPromise
    ])
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.dropTable('UserNotificationSettingsMobile'),
      queryInterface.dropTable('notificationDeviceTokens'),
    ])
  }
}
