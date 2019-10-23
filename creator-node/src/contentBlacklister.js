const { logger } = require('./logging')
const config = require('./config')
const models = require('./models')

const BlacklistInterval = 3000 // 10000ms

class ContentBlacklister {
  constructor () {
    this.processIntervalId = null
    this.processing = false
  }

  start () {
    logger.info('starting content blacklister')
    this.processIntervalId = setInterval(() => this._process(), BlacklistInterval)
  }

  /**
   * TODO - maintain list of previously blacklisted content to avoid repeat processing
   */
  _process () {
    if (this.processing) {
      logger.info(`Previous processing job still in progress. Will retry next interval.`)
      return
    }
    this.processing = true

    try {
      const artistBlacklist = (config.get('artistBlacklist') || []).split(',')
      const trackBlacklist = (config.get('trackBlacklist') || []).split(',')

      const trackIds = new Set(trackBlacklist)

      // Fetch all tracks created by artists in artistBlacklist
      for (const artistId of artistBlacklist) {
        logger.info(`artist ${artistId}`)
        // aggregate all track IDs for later processing
      }

      for (const trackId of trackIds) {
        // unpin from IPFS

        // remove from DB (just mark as blacklisted (?))

        // remove segment file from FS
      }
    } catch (e) {
      logger.error('PROCESSING ERROR ', e)
    } finally {
      this.processing = false
    }
  }
}

module.exports = ContentBlacklister
