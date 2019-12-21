'use strict'
module.exports = (sequelize, DataTypes) => {
  const notificationDeviceToken = sequelize.define('notificationDeviceToken', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    deviceToken: {
      type: DataTypes.STRING,
      allowNull: false
    },
    deviceType: {
      type: DataTypes.ENUM({
        values: [
          'ios',
          'android'
        ]
      }),
      allowNull: false,
      defaultValue: true
    },
    awsARN: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: true
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }

  }, {})

  return notificationDeviceToken
}
