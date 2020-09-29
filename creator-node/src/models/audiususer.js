'use strict'
module.exports = (sequelize, DataTypes) => {
  const AudiusUser = sequelize.define('AudiusUser', {
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
  }, {
    indexes: [
      {
        unique: true,
        fields: ['blockchainId', 'clock']
      }
    ]
  })
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
    // Track also has a composite foreign key on ClockRecords (cnodeUserUUID, clock)
    // sequelize does not support composite foreign keys
  }
  return AudiusUser
}
