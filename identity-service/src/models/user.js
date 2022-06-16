'use strict'
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    blockchainUserId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    // allowNull is true because associate will set handle later
    handle: {
      type: DataTypes.STRING,
      allowNull: true,
      index: true
    },
    IP: {
      type: DataTypes.STRING,
      allowNull: true
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // allowNull is true because associate will set walletAddress later
    walletAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isConfigured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isAbusive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    // this is the last time we have an activity for this user
    // could be updated whenever we relay a tx on behalf of them
    lastSeenDate: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {})

  return User
}
