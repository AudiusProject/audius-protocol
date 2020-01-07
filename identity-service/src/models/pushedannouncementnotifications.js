'use strict'
module.exports = (sequelize, DataTypes) => {
  const pushedAnnouncementNotifications = sequelize.define('pushedAnnouncementNotifications', {
    announcementId: DataTypes.STRING
  }, {})
  pushedAnnouncementNotifications.associate = function (models) {
    // associations can be defined here
  }
  return pushedAnnouncementNotifications
}
