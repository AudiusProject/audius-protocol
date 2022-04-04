'use strict'
module.exports = (sequelize, DataTypes) => {
  const UserEvents = sequelize.define('UserEvents', {
    walletAddress: {
      type: DataTypes.STRING,
      primaryKey: true,
      references: { model: 'Users', key: 'walletAddress' }
    },
    needsRecoveryEmail: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    hasSentDownloadAppEmail: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    hasSignedInNativeMobile: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    playlistUpdates: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {})

  return UserEvents
}
