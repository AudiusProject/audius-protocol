import { tracing } from '../tracer'
import { logger } from '../logging'
import { timeout } from '../utils'

const TEN_MINS_IN_MS = 1000 * 60 * 10
export class TrustedNotifierManager {
  nodeConfig: any
  audiusLibs: any
  trustedNotifierID: any
  trustedNotifierEnabled: boolean
  trustedNotifierData: {
    email: string | null
    wallet: string | null
    endpoint: string | null
  }

  trustedNotifierChainData: {
    email: string | null
    wallet: string | null
    endpoint: string | null
  } | null

  constructor(nodeConfig: any, audiusLibs: any) {
    this.nodeConfig = nodeConfig
    this.audiusLibs = audiusLibs

    this.trustedNotifierID = this.nodeConfig.get('trustedNotifierID')
    this.trustedNotifierEnabled = true
    if (isNaN(this.trustedNotifierID) || this.trustedNotifierID <= 0)
      this.trustedNotifierEnabled = false

    // will be set in init
    this.trustedNotifierData = {
      email: null,
      wallet: null,
      endpoint: null
    }
    this.trustedNotifierChainData = null

    if (!this.audiusLibs) {
      throw new Error(
        'TrustedNotifierManager missing required config audiusLibs'
      )
    }
  }

  logInfo(msg: string) {
    tracing.info(msg)
    logger.info(`TrustedNotifierManager || ${msg}`)
  }

  logError(msg: string) {
    tracing.error(msg)
    logger.error(`TrustedNotifierManager ERROR || ${msg}`)
  }

  async init(): Promise<void> {
    if (!this.trustedNotifierEnabled) {
      const nodeOperatorEmailAddress = this.nodeConfig.get(
        'nodeOperatorEmailAddress'
      )
      this.trustedNotifierData.email = nodeOperatorEmailAddress
      return
    }

    try {
      this.trustedNotifierChainData =
        await this.audiusLibs.ethContracts.TrustedNotifierManagerClient.getNotifierForID(
          this.trustedNotifierID
        )

      // if notifier is not registered at that index, retry
      if (
        this.trustedNotifierChainData!.wallet ===
        '0x0000000000000000000000000000000000000000'
      ) {
        this.logInfo(
          `Could not recover a trustedNotifier at index ${this.trustedNotifierID}, trying again soon`
        )
        await timeout(TEN_MINS_IN_MS, false)
        return this.init()
      }

      this.trustedNotifierData = this.trustedNotifierChainData!
    } catch (e: any) {
      tracing.recordException(e)
      this.logError(`Failed to initialize: ${e}`)
    }
  }

  getTrustedNotifierData() {
    return this.trustedNotifierData
  }
}
