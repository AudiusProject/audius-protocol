'use strict'

/**
 * TODO comment
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.addHook('beforeCreate', 'clockRecordBeforeCreate', async function (instance, options) {
      if (instance.constructor.name !== 'ClockRecord') { return }

      const clockRecord = instance
      const clock = clockRecord.clock

      // DBManager calls ClockRecord.create() with a subquery for clock, which breaks this pattern
      if (typeof clock !== 'number') {
        return
      }

      // clockValue must be > 0
      if (clock <= 0) {
        return queryInterface.sequelize.Promise.reject('Clock value must be > 0')
      }

      // get previous clockRecord for cnodeUser
      // this query is very fast because (cnodeUserUUID, clock) is indexed
      const currentMaxClock = await queryInterface.sequelize.models.ClockRecord.max('clock', {
        where: { cnodeUserUUID: clockRecord.cnodeUserUUID },
        transaction: options.transaction
      })

      // If first clockRecord entry, clock value must be 1
      if (!currentMaxClock && clockRecord.clock !== 1) {
        return queryInterface.sequelize.Promise.reject('First clockRecord for cnodeUser must have clock value 1')
      }

      // error if new entry.clock is not previous.clock + 1
      if (currentMaxClock && clock !== currentMaxClock + 1) {
        return queryInterface.sequelize.Promise.reject('Can only insert contiguous clock values')
      }
    })

    await queryInterface.sequelize.addHook('beforeBulkCreate', 'clockRecordBeforeBulkCreate', async function (instances, options) {
      if (instances.length && instances[0].constructor.name !== 'ClockRecord') {
        return
      }

      const clockRecords = instances

      // Ensure first clockRecord meets all above rules
      let previousClock
      if (clockRecords.length) {
        const clockRecord = clockRecords[0]
        const clock = clockRecord.clock

        // clockValue must be > 0
        if (clock <= 0) {
          return queryInterface.sequelize.Promise.reject('Clock value must be > 0')
        }

        // get previous clockRecord for cnodeUser
        // this query is very fast because (cnodeUserUUID, clock) is indexed
        const currentMaxClock = await queryInterface.sequelize.models.ClockRecord.max('clock', {
          where: { cnodeUserUUID: clockRecord.cnodeUserUUID },
          transaction: options.transaction
        })

        // If first clockRecord entry, clock value must be 1
        if (!currentMaxClock && clockRecord.clock !== 1) {
          return queryInterface.sequelize.Promise.reject('First clockRecord for cnodeUser must have clock value 1')
        }

        // error if new entry.clock is not previous.clock + 1
        if (currentMaxClock && clock !== currentMaxClock + 1) {
          return queryInterface.sequelize.Promise.reject('Can only insert contiguous clock values')
        }

        previousClock = clock
      }

      // Ensure each successive clockRecord is contiguous
      for await (const clockRecord of clockRecords.slice(1)) {
        const clock = clockRecord.clock

        // error if new clock is not previousClock + 1
        if (previousClock && clock !== previousClock + 1) {
          return queryInterface.sequelize.Promise.reject('Can only insert contiguous clock values')
        }

        previousClock = clock
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.removeHook('beforeCreate', 'clockRecordBeforeCreate')
    await queryInterface.sequelize.removeHook('beforeBulkCreate', 'clockRecordBeforeBulkCreate')
  }
}
