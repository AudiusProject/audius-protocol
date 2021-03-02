'use strict'

module.exports = (sequelize, DataTypes) => {
  const BotScores = sequelize.define('BotScores', {
    id: {
      allowNull: false,
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    walletAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      index: true
    },
    recaptchaScore: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    recaptchaContext: {
      type: DataTypes.STRING,
      allowNull: false
    },
    recaptchaHostname: {
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
  return BotScores
}
