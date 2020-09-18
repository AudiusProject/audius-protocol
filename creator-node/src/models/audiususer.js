'use strict'
module.exports = (sequelize, DataTypes) => {
  const AudiusUser = sequelize.define('AudiusUser', {
    cnodeUserUUID: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false
    },
    clock: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    blockchainId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    metadataFileUUID: {
      type: DataTypes.UUID,
      allowNull: false
    },
    metadataJSON: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    coverArtFileUUID: {
      type: DataTypes.UUID,
      allowNull: true
    },
    profilePicFileUUID: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {})
  AudiusUser.associate = function (models) {
    AudiusUser.belongsTo(models.CNodeUser, {
      foreignKey: 'cnodeUserUUID',
      sourceKey: 'cnodeUserUUID',
      onDelete: 'RESTRICT'
    })
    AudiusUser.belongsTo(models.File, {
      foreignKey: 'metadataFileUUID',
      sourceKey: 'fileUUID',
      onDelete: 'RESTRICT'
    })
    AudiusUser.belongsTo(models.File, {
      foreignKey: 'coverArtFileUUID',
      sourceKey: 'fileUUID',
      onDelete: 'RESTRICT'
    })
    AudiusUser.belongsTo(models.File, {
      foreignKey: 'profilePicFileUUID',
      sourceKey: 'fileUUID',
      onDelete: 'RESTRICT'
    })
  }
  return AudiusUser
}
