'use strict'

module.exports = (sequelize, DataTypes) => {
  const UserIPs = sequelize.define('UserIPs', {
    handle: {
      allowNull: false,
      type: DataTypes.STRING,
      primaryKey: true
    },
    userIP: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {})
  return UserIPs
}
