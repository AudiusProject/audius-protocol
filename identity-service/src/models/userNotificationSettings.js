'use strict'
module.exports = (sequelize, DataTypes) => {
  const UserNotificationSettings = sequelize.define('UserNotificationSettings', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    favorites: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    reposts: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    announcements: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    followers: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    browserPushNotifications: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    emailFrequency: {
      allowNull: false,
      type: DataTypes.ENUM('daily', 'weekly', 'off'),
      defaultValue: 'daily'
    }

  }, {})

  return UserNotificationSettings
}
