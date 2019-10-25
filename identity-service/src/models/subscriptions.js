'use strict'
module.exports = (sequelize, DataTypes) => {
  const Subscriptions = sequelize.define('Subscription', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: false,
      primaryKey: true // TODO: consider diff. pkey def.
    },
    subscriber_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {})
  return Subscriptions
}
