'use strict'
module.exports = (sequelize, DataTypes) => {
  const NotificationEmail = sequelize.define(
    'NotificationEmail',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        primaryKey: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        index: true
      },
      emailFrequency: {
        allowNull: false,
        type: DataTypes.ENUM('live', 'daily', 'weekly', 'off'),
        defaultValue: 'live'
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE
      }
    },
    {}
  )
  NotificationEmail.associate = function () {
    // associations can be defined here
  }
  return NotificationEmail
}
