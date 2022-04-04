'use strict'
module.exports = (sequelize, DataTypes) => {
  const ProtocolServiceProviders = sequelize.define('ProtocolServiceProviders', {
    wallet: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    minimumDelegationAmount: {
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

  return ProtocolServiceProviders
}
