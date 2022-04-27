'use strict'

module.exports = (sequelize, DataTypes) => {
  const Playlist = sequelize.define(
    'Playlist',
    {
      cnodeUserUUID: {
        type: DataTypes.UUID,
        primaryKey: true, // composite primary key (cnodeUserUUID, clock)
        allowNull: false
      },
      playlistId: {
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
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['playlistId']
        }
      ]
    }
  )

  Playlist.associate = function (models) {
    Playlist.belongsTo(models.CNodeUser, {
      foreignKey: 'cnodeUserUUID',
      targetKey: 'cnodeUserUUID',
      onDelete: 'RESTRICT'
    })
    Playlist.belongsTo(models.File, {
      foreignKey: 'metadataFileUUID',
      targetKey: 'fileUUID',
      onDelete: 'RESTRICT'
    })
    Playlist.belongsTo(models.File, {
      foreignKey: 'coverArtFileUUID',
      targetKey: 'fileUUID',
      onDelete: 'RESTRICT'
    })
  }

  return Playlist
}
