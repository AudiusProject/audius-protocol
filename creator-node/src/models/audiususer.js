'use strict'
module.exports = (sequelize, DataTypes) => {
  const AudiusUser = sequelize.define('AudiusUser', {
    audiusUserUUID: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    blockchainId: {
      type: DataTypes.BIGINT,
      unique: true,
      allowNull: true
    },
    cnodeUserUUID: {
      type: DataTypes.UUID,
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
    },
    clock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    clock2: {
      type: DataTypes.INTEGER
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
