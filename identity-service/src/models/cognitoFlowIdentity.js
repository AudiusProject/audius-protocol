'use strict'

module.exports = (sequelize, DataTypes) => {
  const CognitoFlowIdentity = sequelize.define('CognitoFlowIdentity', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    maskedIdentity: {
      allowNull: false,
      unique: true,
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
