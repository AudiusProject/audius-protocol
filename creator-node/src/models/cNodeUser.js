'use strict'

module.exports = (sequelize, DataTypes) => {
  const CNodeUser = sequelize.define('CNodeUser', {
    cnodeUserUUID: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    walletPublicKey: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    latestBlockNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: -1
    },
    clock: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    clock2: {
      type: DataTypes.INTEGER
    }
  }, {})

  CNodeUser.associate = function (models) {
    CNodeUser.hasMany(models.File, {
      foreignKey: 'cnodeUserUUID',
      sourceKey: 'cnodeUserUUID'
    })
    CNodeUser.hasMany(models.AudiusUser, {
      foreignKey: 'cnodeUserUUID',
      sourceKey: 'cnodeUserUUID'
    })
    CNodeUser.hasMany(models.Track, {
      foreignKey: 'cnodeUserUUID',
      sourceKey: 'cnodeUserUUID'
    })
    // TODO CNodeUser <> SessionToken association?
  }

  return CNodeUser
}
