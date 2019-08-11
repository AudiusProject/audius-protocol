'use strict'
module.exports = (sequelize, DataTypes) => {
  const TwitterUser = sequelize.define('TwitterUser', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    twitterProfile: {
      type: DataTypes.JSONB,
      allowNull: false,
      unique: false
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    blockchainUserId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {})

  return TwitterUser
}
