'use strict'
module.exports = (sequelize, DataTypes) => {
  const UserNotificationSettingsMobile = sequelize.define('UserNotificationSettingsMobile', {
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
    milestonesAndAchievements: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    reposts: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    // TODO - does this need to be in push notifs?
    // announcements: {
    //   type: DataTypes.BOOLEAN,
    //   allowNull: false,
    //   defaultValue: true
    // },
    followers: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }

  }, {})

  return UserNotificationSettingsMobile
}
