const { logger } = require('../logging')

class TrustedNotifierManager {
  constructor(nodeConfig, audiusLibs) {
    this.nodeConfig = nodeConfig
    this.audiusLibs = audiusLibs

    this.trustedNotifierIndex = nodeConfig.get('trustedNotifierIndex')
    this.trustedNotifierEnabled = !!this.trustedNotifierIndex

    if (
      !this.audiusLibs
    ) {
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
    const trustedNotifier = await this.audiusLibs.ethContracts.TrustedNotifierManagerClient.getNotifierForID(this.trustedNotifierIndex)
    console.log('trustedNotifier', trustedNotifier)
  }
}

module.exports = TrustedNotifierManager
