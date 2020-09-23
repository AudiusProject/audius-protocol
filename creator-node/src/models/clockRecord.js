'use strict'
module.exports = (sequelize, DataTypes) => {
  // TODO - why is this not externally accessible?
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

  /**
   * TODO - enforce composite foreign key (cnodeUserUUID, clock) on all SourceTables
   *  - https://stackoverflow.com/questions/9984022/postgres-fk-referencing-composite-pk
   */
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
