import {
  developmentConfig,
  DiscoveryNodeSelector,
  getDefaultDiscoveryNodeSelectorConfig,
  productionConfig,
  stagingConfig
} from '@audius/sdk'

import { Env } from '../../env'
import {
  BooleanKeys,
  IntKeys,
  RemoteConfigInstance,
  StringKeys
} from '../../remote-config'

type DiscoveryNodeSelectorConfig = {
  env: Env
  remoteConfigInstance: RemoteConfigInstance
  initialSelectedNode?: string
  onChange?: (endpoint: string) => void
}

export class DiscoveryNodeSelectorService {
  private env: Env
  private remoteConfigInstance: RemoteConfigInstance
  private discoveryNodeSelectorPromise: Promise<DiscoveryNodeSelector> | null
  private initialSelectedNode: string | undefined
  private onChange: ((endpoint: string) => void) | undefined

  constructor(config: DiscoveryNodeSelectorConfig) {
    const { env, remoteConfigInstance, initialSelectedNode, onChange } = config
    this.env = env
    this.remoteConfigInstance = remoteConfigInstance
    this.discoveryNodeSelectorPromise = null
    this.initialSelectedNode = initialSelectedNode
    this.onChange = onChange
  }

  private async makeDiscoveryNodeSelector() {
    const { getRemoteVar, waitForRemoteConfig } = this.remoteConfigInstance

    await waitForRemoteConfig()

    const bootstrapConfig =
      this.env.ENVIRONMENT === 'development'
        ? developmentConfig
        : this.env.ENVIRONMENT === 'staging'
          ? stagingConfig
          : productionConfig

    const { minVersion } = bootstrapConfig.network

    const maxBlockDiff =
      getRemoteVar(IntKeys.DISCOVERY_NODE_MAX_BLOCK_DIFF) ?? undefined
    const maxSlotDiffPlays = getRemoteVar(
      BooleanKeys.ENABLE_DISCOVERY_NODE_MAX_SLOT_DIFF_PLAYS
    )
      ? getRemoteVar(IntKeys.DISCOVERY_NODE_MAX_SLOT_DIFF_PLAYS)
      : null

    const healthCheckThresholds = { minVersion, maxBlockDiff, maxSlotDiffPlays }

    const blocklist = this.getBlockList(StringKeys.DISCOVERY_NODE_BLOCK_LIST)

    const requestTimeout =
      getRemoteVar(IntKeys.DISCOVERY_PROVIDER_SELECTION_TIMEOUT_MS) ?? undefined

    const dnSelector = new DiscoveryNodeSelector({
      ...getDefaultDiscoveryNodeSelectorConfig(bootstrapConfig),
      healthCheckThresholds,
      blocklist,
      requestTimeout,
      initialSelectedNode: this.initialSelectedNode
    })
    if (this.onChange) {
      dnSelector.addEventListener('change', this.onChange)
    }
    return dnSelector
  }

  private getBlockList(remoteVarKey: StringKeys) {
    const list = this.remoteConfigInstance.getRemoteVar(remoteVarKey)
    if (list) {
      try {
        return new Set<string>(list.split(',').map((s) => s.trim()))
      } catch (e) {
        console.error(e)
        return null
      }
    }
    return null
  }

  public async getInstance() {
    if (!this.discoveryNodeSelectorPromise) {
      this.discoveryNodeSelectorPromise = this.makeDiscoveryNodeSelector()
    }
    return await this.discoveryNodeSelectorPromise
  }
}
