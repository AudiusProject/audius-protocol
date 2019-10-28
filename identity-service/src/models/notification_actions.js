'use strict'
module.exports = (sequelize, DataTypes) => {
  const NotificationAction = sequelize.define('NotificationAction', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    notificationId: {
      type: DataTypes.UUID,
      allowNull: false // TODO: make this a foreign key
    },
    actionEntityType: { // TODO: make this enum
      type: DataTypes.TEXT,
      allowNull: false
    },
    actionEntityId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {})
  return NotificationAction
}
