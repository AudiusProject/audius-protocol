'use strict'

module.exports = (sequelize, DataTypes) => {
  const RecaptchaScores = sequelize.define('RecaptchaScores', {
    id: {
      allowNull: false,
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    walletAddress: {
      type: DataTypes.STRING,
      allowNull: false
    },
    score: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    context: {
      type: DataTypes.STRING,
      allowNull: false
    },
    hostname: {
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
  return RecaptchaScores
}
