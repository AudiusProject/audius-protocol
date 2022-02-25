const { logger } = require('../logging')

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const FIVE_MINUTES = 60000 * 5
class TrustedNotifierManager {
  constructor(nodeConfig, audiusLibs) {
    this.nodeConfig = nodeConfig
    this.audiusLibs = audiusLibs

    this.trustedNotifierIndex = nodeConfig.get('trustedNotifierIndex')
    this.trustedNotifierEnabled = !!this.trustedNotifierIndex
    this.trustedNotifier = null // will be set in init

    if (!this.audiusLibs) {
      throw new Error(
        'TrustedNotifierManager missing required config audiusLibs'
      )
    }
  }

  logInfo(msg) {
    logger.info(`TrustedNotifierManager || ${msg}`)
  }

  logError(msg) {
    logger.error(`TrustedNotifierManager ERROR || ${msg}`)
  }

  async init() {
    this.trustedNotifier =
      await this.audiusLibs.ethContracts.TrustedNotifierManagerClient.getNotifierForID(
        this.trustedNotifierIndex
      )
    if (
      this.trustedNotifier.wallet ===
      '0x0000000000000000000000000000000000000000'
    ) {
      this.logInfo(
        `Could not recover a trustedNotifier at index ${this.trustedNotifierIndex}, trying again in 5 minutes`
      )
      await wait(FIVE_MINUTES)
      return this.init()
    }
  }

  getTrustedNotifier() {
    return this.trustedNotifier
  }
}

module.exports = TrustedNotifierManager
