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
      /**
       * will run before create op in DBManager.createNewDataRecord()
       */
      beforeCreate: async function (clockRecord, options) {
        const clock = clockRecord.clock

        // DBManager calls ClockRecord.create() with a subquery for clock value instead of a number literal.
        // Short-circuit in that case since no validation is required.
        if (typeof clock !== 'number') {
          return
        }

        // clock value must be > 0
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

        // If not first clockRecord entry, clock value must be (previous.clock + 1)
        if (currentMaxClock && clock !== currentMaxClock + 1) {
          return sequelize.Promise.reject(`Can only insert contiguous clock values. Inconsistency in beforeCreate currentMaxClock: ${currentMaxClock}, clock: ${clock}`)
        }
      },

      /**
       * will run before bulkCreate op in nodesync
       * performs same validation as beforeCreate hook above
       */
      beforeBulkCreate: async function (clockRecords, options) {
        // Ensure first clockRecord meets all above rules
        let previousClock
        if (clockRecords.length) {
          const clockRecord = clockRecords[0]
          const clock = clockRecord.clock

          // DBManager calls ClockRecord.create() with a subquery for clock value instead of a number literal.
          // Short-circuit in that case since no validation is required.
          if (typeof clock !== 'number') {
            return
          }

          // clock value must be > 0
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

          // If not first clockRecord entry, clock value must be (previous.clock + 1)
          if (currentMaxClock && clock !== currentMaxClock + 1) {
            return sequelize.Promise.reject(`Can only insert contiguous clock values. Inconsistency in beforeBulkCreate currentMaxClock: ${currentMaxClock}, clock: ${clock}`)
          }

          previousClock = clock
        }

        // Ensure each successive clockRecord is contiguous
        for await (const clockRecord of clockRecords.slice(1)) {
          const clock = clockRecord.clock

          // error if new clock is not previousClock + 1
          if (previousClock && clock !== previousClock + 1) {
            return sequelize.Promise.reject(`Can only insert contiguous clock values. Inconsistency in beforeCreate previousClock: ${previousClock}, clock: ${clock}`)
          }

          previousClock = clock
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
