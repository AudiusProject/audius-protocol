'use strict'
module.exports = (sequelize, DataTypes) => {
  const Subscriptions = sequelize.define('Subscription', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: false,
      primaryKey: true // TODO: consider diff. pkey def.
    },
    subscriberId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {})
  return Subscriptions
}
