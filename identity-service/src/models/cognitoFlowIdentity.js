'use strict'

module.exports = (sequelize, DataTypes) => {
  const CognitoFlowIdentity = sequelize.define('CognitoFlowIdentity', {
    maskedIdentity: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING
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
  return CognitoFlowIdentity
}
