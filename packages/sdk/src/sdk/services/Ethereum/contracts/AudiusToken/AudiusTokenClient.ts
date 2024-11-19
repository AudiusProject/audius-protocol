import { AudiusToken } from '@audius/eth'
import type { Hex } from 'viem'

import type { AudiusWalletClient } from '../../../AudiusWalletClient'
import { EthereumContract } from '../EthereumContract'

import type { AudiusTokenConfig } from './types'

export class AudiusTokenClient extends EthereumContract {
  private readonly contract: AudiusToken
  private readonly walletClient: AudiusWalletClient

  constructor(config: AudiusTokenConfig) {
    super(config)

    this.contract = new AudiusToken(config.client)
    this.walletClient = config.walletClient
  }

  public async permit(params: {
    address: Hex
    amount: bigint
    deadline: bigint
  }) {
    const { address: spender, amount: value, deadline } = params
    const owner = (await this.walletClient.getAddress()) as Hex
    const nonce = await this.contract.nonces(owner)
    const contractArgs = {
      owner,
      spender,
      value,
      nonce,
      deadline
    }
    const typedData = await this.contract.getPermitTypedData(contractArgs)
    const signature = await this.walletClient.signTypedData(typedData)
    const res = await this.contract.permit({
      ...contractArgs,
      signature: signature as Hex
    })
    return await this.walletClient.sendTransaction(res.request)
  }
}
