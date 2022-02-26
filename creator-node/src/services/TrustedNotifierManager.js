const { logger } = require('../logging')
const axios = require('axios')

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const ONE_MIN = 1000 * 60
class TrustedNotifierManager {
  constructor(nodeConfig, audiusLibs) {
    this.nodeConfig = nodeConfig
    this.audiusLibs = audiusLibs

    this.trustedNotifierSelection = this.nodeConfig.get(
      'trustedNotifierSelection'
    )
    this.trustedNotifierEnabled = !!this.trustedNotifierSelection

    // will be set in init
    this.trustedNotifierData = {
      emailAddress: null,
      wallet: null,
      endpoint: null
    }

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
    if (!this.trustedNotifierEnabled) {
      const nodeOperatorEmailAddress = this.nodeConfig.get(
        'nodeOperatorEmailAddress'
      )
      this.trustedNotifierData.emailAddress = nodeOperatorEmailAddress
      return
    }

    try {
      // intermediate variable to cache value from chain
      if (!this.trustedNotifierChainData) {
        this.trustedNotifierChainData =
          await this.audiusLibs.ethContracts.TrustedNotifierManagerClient.getNotifierForID(
            this.trustedNotifierSelection
          )
      }

      // if server is not up, retry
      if (
        this.trustedNotifierChainData.wallet ===
        '0x0000000000000000000000000000000000000000'
      ) {
        this.logInfo(
          `Could not recover a trustedNotifier at index ${this.trustedNotifierSelection}, trying again soon`
        )
        await wait(ONE_MIN)
        return this.init()
      }

      try {
        const healthCheckEndpoint = `${this.trustedNotifierChainData.endpoint.replace(
          /\/$/,
          ''
        )}/health_check`

        const resp = (await axios.get(healthCheckEndpoint)).data
        if (resp && resp.emailAddress) {
          this.trustedNotifierData = {
            emailAddress: resp.emailAddress,
            ...this.trustedNotifierChainData
          }
        }
      } catch (e) {
        await wait(ONE_MIN)
        return this.init()
      }
    } catch (e) {
      console.error(e)
    }
  }

  getTrustedNotifier() {
    return this.trustedNotifierData
  }
}

module.exports = TrustedNotifierManager
