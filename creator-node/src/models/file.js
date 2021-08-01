'use strict'

module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define('File', {
    fileUUID: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    cnodeUserUUID: {
      type: DataTypes.UUID,
      allowNull: false
    },
    // only non-null for track/copy320 files (as opposed to image/metadata files)
    trackBlockchainId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    multihash: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    // only non-null for track files (as opposed to image/metadata files)
    // contains original track file name (meaning all track segment Files will contain same track sourceFile)
    sourceFile: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // the queryable filename if this file entry is inside a dir
    // used for images that are stored in IPFS directories (e.g. /CID/fileName.jpg)
    fileName: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // the parent dir's CID if this file entry is inside a dir
    dirMultihash: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    storagePath: { // format: '/file_storage/__multihash__
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(16),
      allowNull: true,
      validate: {
        // track and non types broken down below and attached to Track model
        isIn: [['track', 'metadata', 'image', 'dir', 'copy320']]
      }
    },
    clock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    skipped: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    indexes: [
      {
        fields: ['cnodeUserUUID']
      },
      {
        fields: ['multihash']
      },
      {
        fields: ['dirMultihash']
      },
      {
        fields: ['trackBlockchainId']
      },
      {
        unique: true,
        fields: ['cnodeUserUUID', 'clock']
      },
      {
        fields: ['skipped']
      }
    ]
  })

  /**
   * @dev - there is intentionally no reference from File.trackBlockchainId to Track.blockchainId. This is to
   *    remove the two-way association between these models
   */
  File.associate = function (models) {
    File.belongsTo(models.CNodeUser, {
      foreignKey: 'cnodeUserUUID',
      sourceKey: 'cnodeUserUUID',
      onDelete: 'RESTRICT'
    })
    // File also has a composite foreign key on ClockRecords (cnodeUserUUID, clock)
    // sequelize does not support composite foreign keys
  }

  // TODO - why is this not externally accessible?
  File.TrackTypes = ['track', 'copy320']
  File.NonTrackTypes = ['dir', 'image', 'metadata']

  return File
}
