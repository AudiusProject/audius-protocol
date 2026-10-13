import type { SdkServicesConfig } from '../../../../config/types'
import { createLazyLoader, type PublicInterface } from '../../../../utils/lazy'

import type { ClaimableTokensClient } from './ClaimableTokensClient'
import type { ClaimableTokensConfig } from './types'

type Client = ClaimableTokensClient

/**
 * Same interface as ClaimableTokensClient, but the client (and @audius/spl,
 * anchor, spl-token) is only loaded on the first method call.
 */
export class LazyClaimableTokensClient implements PublicInterface<Client> {
  private readonly loader

  /**
   * @param servicesConfig if set, the environment defaults (program ID, mints)
   * are applied under `config` when the client loads.
   */
  constructor(
    config: ClaimableTokensConfig,
    servicesConfig?: SdkServicesConfig
  ) {
    this.loader = createLazyLoader(async () => {
      const [{ ClaimableTokensClient }, { getDefaultClaimableTokensConfig }] =
        await Promise.all([
          import('./ClaimableTokensClient'),
          import('./getDefaultConfig')
        ])
      return new ClaimableTokensClient(
        servicesConfig
          ? { ...getDefaultClaimableTokensConfig(servicesConfig), ...config }
          : config
      )
    })
  }

  async getOrCreateUserBank(
    ...args: Parameters<Client['getOrCreateUserBank']>
  ) {
    return (await this.loader.get()).getOrCreateUserBank(...args)
  }

  async createUserBankIfNeededInstruction(
    ...args: Parameters<Client['createUserBankIfNeededInstruction']>
  ) {
    return (await this.loader.get()).createUserBankIfNeededInstruction(...args)
  }

  async createCloseAuthorityInstructions(
    ...args: Parameters<Client['createCloseAuthorityInstructions']>
  ) {
    return (await this.loader.get()).createCloseAuthorityInstructions(...args)
  }

  async createTransferInstruction(
    ...args: Parameters<Client['createTransferInstruction']>
  ) {
    return (await this.loader.get()).createTransferInstruction(...args)
  }

  async createTransferSecpInstruction(
    ...args: Parameters<Client['createTransferSecpInstruction']>
  ) {
    return (await this.loader.get()).createTransferSecpInstruction(...args)
  }

  async getNonce(...args: Parameters<Client['getNonce']>) {
    return (await this.loader.get()).getNonce(...args)
  }

  async deriveUserBank(...args: Parameters<Client['deriveUserBank']>) {
    return (await this.loader.get()).deriveUserBank(...args)
  }

  async sendTransaction(...args: Parameters<Client['sendTransaction']>) {
    return (await this.loader.get()).sendTransaction(...args)
  }
}
