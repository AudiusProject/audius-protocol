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
  }, {
    hooks: {
      beforeSave: async function (clockRecord, options) {
        const clock = clockRecord.clock

        // clockValue must be > 0
        if (clock <= 0) {
          return sequelize.Promise.reject('Clock value must be > 0')
        }

        // get previous clockRecord for cnodeUser
        // this query is very fast because (cnodeUserUUID, clock) is indexed
        const currentMaxClock = await sequelize.models.ClockRecord.max('clock', {
          where: { cnodeUserUUID: clockRecord.cnodeUserUUID },
          transaction: options.transaction
        })

        // If first clockRecord entry, clock value must be 1
        if (!currentMaxClock && clockRecord.clock !== 1) {
          return sequelize.Promise.reject('First clockRecord for cnodeUser must have clock value 1')
        }

        // error if new entry.clock is not previous.clock + 1
        if (currentMaxClock && clock !== currentMaxClock + 1) {
          return sequelize.Promise.reject('Can only insert contiguous clock values')
        }
      }
    }
  })

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
