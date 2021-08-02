'use strict'

module.exports = (sequelize, DataTypes) => {
  const CognitoFlows = sequelize.define('CognitoFlows', {
    id: {
      allowNull: false,
      type: DataTypes.STRING,
      primaryKey: true
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    handle: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    score: {
      type: DataTypes.DECIMAL,
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
  return CognitoFlows
}
