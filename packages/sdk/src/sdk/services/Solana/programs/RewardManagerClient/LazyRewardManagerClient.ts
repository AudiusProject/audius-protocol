import type { PublicKey } from '@solana/web3.js'

import { productionConfig } from '../../../../config/production'
import { createLazyLoader, type PublicInterface } from '../../../../utils/lazy'
import { mergeConfigWithDefaults } from '../../../../utils/mergeConfigs'

import type { RewardManagerClient } from './RewardManagerClient'
import { getDefaultRewardManagerClentConfig } from './getDefaultConfig'
import type { RewardManagerClientConfig } from './types'

type Client = RewardManagerClient

/**
 * Same interface as RewardManagerClient, but the client (and @audius/spl,
 * anchor) is only loaded on the first method call.
 */
export class LazyRewardManagerClient implements PublicInterface<Client> {
  public readonly lookupTable: PublicKey
  private readonly loader

  constructor(config: RewardManagerClientConfig) {
    this.lookupTable = mergeConfigWithDefaults(
      config,
      getDefaultRewardManagerClentConfig(productionConfig)
    ).rewardManagerLookupTable
    this.loader = createLazyLoader(async () => {
      const { RewardManagerClient } = await import('./RewardManagerClient')
      return new RewardManagerClient(config)
    })
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
