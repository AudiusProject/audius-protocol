'use strict'

module.exports = (sequelize, DataTypes) => {
  const Track = sequelize.define('Track', {
    trackUUID: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
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
    blockchainId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      unique: true
    },
    coverArtFileUUID: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {})

  Track.associate = function (models) {
    Track.belongsTo(models.CNodeUser, {
      foreignKey: 'cnodeUserUUID',
      targetKey: 'cnodeUserUUID',
      onDelete: 'RESTRICT'
    })
    Track.belongsTo(models.File, { // belongsTo, or hasMany?
      foreignKey: 'trackUUID',
      targetKey: 'trackUUID',
      onDelete: 'RESTRICT'
    })
    Track.belongsTo(models.File, { // belongsTo, or hasOne
      foreignKey: 'metadataFileUUID',
      targetKey: 'fileUUID',
      onDelete: 'RESTRICT'
    })
    Track.belongsTo(models.File, {
      foreignKey: 'coverArtFileUUID',
      targetKey: 'fileUUID',
      onDelete: 'RESTRICT'
    })
  }

  return Track
}
