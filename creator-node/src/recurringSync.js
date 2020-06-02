const Bull = require('bull')
const { logger } = require('./logging')
const config = require('./config.js')

class RecurringSync {
  constructor () {
    this.recurringSyncQueue = new Bull(
      'recurring-syncs',
      {
        redis: {
          port: config.get('redisPort'),
          host: config.get('redisHost')
        }
      }
    )
  }
  async init () {
    // run the task every 6 hours
    this.recurringSyncQueue.add({}, { repeat: { cron: '0 */6 * * *' } })

    // Email notification queue
    this.recurringSyncQueue.process(async (job, done) => {
      logger.info('Process recurring sync')
      done()
    })
  }
}

module.exports = RecurringSync
