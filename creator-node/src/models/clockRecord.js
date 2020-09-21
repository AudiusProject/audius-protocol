'use strict'
module.exports = (sequelize, DataTypes) => {
  // reference models/File.js
  const SourceTableTypesObj = {
    AudiusUser: 'AudiusUser',
    Track: 'Track',
    File: 'File'
  }

  const ClockRecord = sequelize.define('ClockRecord', {
    cnodeUserUUID: {
      type: DataTypes.UUID,
      primaryKey: true, // composite PK with clock
      unique: false,
      allowNull: false,
      references: {
        model: 'CNodeUsers',
        key: 'cnodeUserUUID',
        as: 'cnodeUserUUID'
      },
      onDelete: 'RESTRICT'
    },
    clock: {
      type: DataTypes.INTEGER,
      primaryKey: true, // composite PK with cnodeUserUUID
      unique: false,
      allowNull: false
    },
    sourceTable: {
      type: DataTypes.ENUM(
        ...Object.values(SourceTableTypesObj)
      ),
      allowNull: false
    }
  }, {})

  ClockRecord.associate = (models) => {
    ClockRecord.belongsTo(models.CNodeUser, {
      foreignKey: 'cnodeUserUUID',
      sourceKey: 'cnodeUserUUID',
      onDelete: 'RESTRICT'
    })
  }

  ClockRecord.SourceTableTypesObj = SourceTableTypesObj

  return ClockRecord
}
