'use strict'

module.exports = (sequelize, DataTypes) => {
  const BetaPassword = sequelize.define('BetaPassword', {
    password: {
      type: DataTypes.STRING,
      primaryKey: true,
      autoIncrement: false,
      allowNull: false
    },
    remainingLogins: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {})

  BetaPassword.associate = function (models) {
    // associations can be defined here
  }

  return BetaPassword
}
