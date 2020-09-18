'use strict'

module.exports = (sequelize, DataTypes) => {
  const Track = sequelize.define('Track', {
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
    }
  }, {})

  Track.associate = function (models) {
    Track.belongsTo(models.CNodeUser, {
      foreignKey: 'cnodeUserUUID',
      targetKey: 'cnodeUserUUID',
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
