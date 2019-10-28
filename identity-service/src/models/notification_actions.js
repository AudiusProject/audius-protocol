'use strict'
module.exports = (sequelize, DataTypes) => {
  const NotificationAction = sequelize.define('NotificationAction', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    notif_id: {
      type: DataTypes.UUID,
      allowNull: false // TODO: make this a foreign key
    },
    entity_type: { // TODO: make this enum
      type: DataTypes.TEXT,
      allowNull: false
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {})
  return NotificationAction
}
