'use strict'
module.exports = (sequelize, DataTypes) => {
  const PushedAnnouncementNotifications = sequelize.define(
    'PushedAnnouncementNotifications',
    {
      announcementId: DataTypes.STRING
    },
    {}
  )
  PushedAnnouncementNotifications.associate = function (models) {
    // associations can be defined here
  }
  return PushedAnnouncementNotifications
}
