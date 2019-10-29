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
      allowNull: false,
      onDelete: 'RESTRICT',
      references: {
        model: 'Notification',
        key: 'id',
        as: 'notificationId'
      }
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

  NotificationAction.associate = function (models) {
    NotificationAction.belongsTo(models.Notification, {
      sourceKey: 'notificationId',
      foreignKey: 'id'
    })
  }

  return NotificationAction
}
