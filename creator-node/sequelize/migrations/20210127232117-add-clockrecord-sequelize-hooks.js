'use strict'

/**
 * Adds Sequelize hooks for beforeCreate(ClockRecord) and beforeBulkCreate(ClockRecord).
 * Hooks enforce these ClockRecord rules:
 * - each clock > 0
 * - initial clock = 1
 * - each subsequent clock = (1 + previous clock)
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.addHook('beforeCreate', 'clockRecordBeforeCreate', async function (instance, options) {
      if (instance.constructor.name !== 'ClockRecord') {
        return
      }

      // clockRecord is the instance passed in the current sequelize CREATE query
      const clockRecord = instance

      const clock = clockRecord.clock

      // DBManager calls ClockRecord.create() with a subquery for clock value instead of a number literal.
      // Short-circuit in that case since no validation is required.
      if (typeof clock !== 'number') {
        return
      }

      // clock value must be > 0
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

      // If not first clockRecord entry, clock value must be (previous.clock + 1)
      if (currentMaxClock && clock !== currentMaxClock + 1) {
        return queryInterface.sequelize.Promise.reject('Can only insert contiguous clock values')
      }
    })

    await queryInterface.sequelize.addHook('beforeBulkCreate', 'clockRecordBeforeBulkCreate', async function (instances, options) {
      if (instances.length && instances[0].constructor.name !== 'ClockRecord') {
        return
      }

      // clockRecords are the instances passed in the current sequelize BULK CREATE query
      const clockRecords = instances

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

        // If not first clockRecord entry, clock value must be (previous.clock + 1)
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
