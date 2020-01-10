'use strict'
module.exports = (sequelize, DataTypes) => {
  const PushNotificationBadgeCounts = sequelize.define('PushNotificationBadgeCounts', {
    userId: {
      type: DataTypes.INTEGER
    },
    iosBadgeCount: {
      type: DataTypes.INTEGER
    }
  }, {})
  PushNotificationBadgeCounts.associate = function (models) {
    // associations can be defined here
  }
  return PushNotificationBadgeCounts
}
