import type { PublicKey } from '@solana/web3.js'

import type { SdkServicesConfig } from '../../../../config/types'
import { createLazyLoader, type PublicInterface } from '../../../../utils/lazy'

import type { RewardManagerClient } from './RewardManagerClient'
import type { RewardManagerClientConfig } from './types'

type Client = RewardManagerClient

/**
 * Same interface as RewardManagerClient, but the client (and @audius/spl,
 * anchor) is only loaded on the first method call.
 */
export class LazyRewardManagerClient implements PublicInterface<Client> {
  private readonly loader
  private readonly configuredLookupTable?: PublicKey

  /**
   * @param servicesConfig if set, the environment defaults (program ID, state,
   * lookup table) are applied under `config` when the client loads.
   */
  constructor(
    config: RewardManagerClientConfig,
    servicesConfig?: SdkServicesConfig
  ) {
    this.configuredLookupTable = config.rewardManagerLookupTable
    this.loader = createLazyLoader(async () => {
      const [{ RewardManagerClient }, { getDefaultRewardManagerClentConfig }] =
        await Promise.all([
          import('./RewardManagerClient'),
          import('./getDefaultConfig')
        ])
      return new RewardManagerClient(
        servicesConfig
          ? { ...getDefaultRewardManagerClentConfig(servicesConfig), ...config }
          : config
      )
    })
  }

  /**
   * The rewards lookup table. Available synchronously when passed in the
   * config, otherwise only once the client has loaded.
   * @throws if neither is the case
   */
  get lookupTable(): PublicKey {
    const lookupTable =
      this.configuredLookupTable ?? this.loader.peek()?.lookupTable
    if (!lookupTable) {
      throw new Error(
        'rewardManagerClient.lookupTable is not available until the client has loaded'
      )
    }
    return lookupTable
  }

  async createSenderInstruction(
    ...args: Parameters<Client['createSenderInstruction']>
  ) {
    return (await this.loader.get()).createSenderInstruction(...args)
  }

  async createSubmitAttestationInstruction(
    ...args: Parameters<Client['createSubmitAttestationInstruction']>
  ) {
    return (await this.loader.get()).createSubmitAttestationInstruction(...args)
  }

  async createSubmitAttestationSecpInstruction(
    ...args: Parameters<Client['createSubmitAttestationSecpInstruction']>
  ) {
    return (await this.loader.get()).createSubmitAttestationSecpInstruction(
      ...args
    )
  }

  async createEvaluateAttestationsInstruction(
    ...args: Parameters<Client['createEvaluateAttestationsInstruction']>
  ) {
    return (await this.loader.get()).createEvaluateAttestationsInstruction(
      ...args
    )
  }

  async getSubmittedAttestations(
    ...args: Parameters<Client['getSubmittedAttestations']>
  ) {
    return (await this.loader.get()).getSubmittedAttestations(...args)
  }

  async getRewardManagerState() {
    return (await this.loader.get()).getRewardManagerState()
  }

  async sendTransaction(...args: Parameters<Client['sendTransaction']>) {
    return (await this.loader.get()).sendTransaction(...args)
  }
}
