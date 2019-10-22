'use strict'
module.exports = (sequelize, DataTypes) => {
  const UserEvents = sequelize.define('UserEvents', {
    walletAddress: {
      type: DataTypes.STRING,
      primaryKey: true,
      references: { model: 'Users', key: 'walletAddress' }
    },
    needsRecoveryEmail: {
      allowNull: true,
      type: DataTypes.BOOLEAN
    }
  }, {})

  return UserEvents
}
