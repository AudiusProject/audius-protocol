'use strict'
module.exports = (sequelize, DataTypes) => {
  const NotificationEmail = sequelize.define('NotificationEmail', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      primaryKey: true
    },
    emailFrequency: {
      allowNull: false,
      type: DataTypes.ENUM('live', 'daily', 'weekly', 'off'),
      defaultValue: 'live'
    }
  }, {})
  NotificationEmail.associate = function (models) {
    // associations can be defined here
  }
  return NotificationEmail
}
