'use strict'

module.exports = (sequelize, DataTypes) => {
  const Track = sequelize.define('Track', {
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
    },
    clock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    clock2: {
      type: DataTypes.INTEGER
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
