'use strict'
module.exports = (sequelize, DataTypes) => {
  const SolanaNotificationAction = sequelize.define('SolanaNotificationAction', {
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
        model: 'SolanaNotification',
        key: 'id',
        as: 'notificationId'
      }
    },
    slot: {
      type: DataTypes.INTEGER,
      allowNull: false
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

  SolanaNotificationAction.associate = function (models) {
    SolanaNotificationAction.belongsTo(models.SolanaNotification, {
      foreignKey: 'notificationId',
      targetKey: 'id'
    })
  }

  return SolanaNotificationAction
}
