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
      clock: {
        type: DataTypes.INTEGER,
        primaryKey: true, // composite primary key (cnodeUserUUID, clock)
        allowNull: false
      },
      blockchainId: {
        type: DataTypes.BIGINT,
        primaryKey: true,
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
      playlistImageFileUUID: {
        type: DataTypes.UUID,
        allowNull: true
      }
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['blockchainId', 'clock']
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
      foreignKey: 'playlistImageFileUUID',
      targetKey: 'fileUUID',
      onDelete: 'RESTRICT'
    })
    // Playlist also has a composite foreign key on ClockRecords (cnodeUserUUID, clock)
    // sequelize does not support composite foreign keys
  }

  return Playlist
}
