import { Wormhole } from '@audius/eth'
import { Chain, toChainId } from '@wormhole-foundation/sdk'
import type { Hex } from 'viem'

import type { AudiusWalletClient } from '../../../AudiusWalletClient'
import { EthereumContract } from '../EthereumContract'

import type { WormholeConfig } from './types'

export class WormholeClient extends EthereumContract {
  contract: Wormhole

  private readonly walletClient: AudiusWalletClient

  constructor(config: WormholeConfig) {
    super(config)
    this.walletClient = config.walletClient
    this.contract = new Wormhole(this.client)
  }

  async transferTokens(params: {
    amount: bigint
    recipientChain: Chain
    recipient: Hex
    deadline?: bigint
    arbiterFee?: bigint
  }) {
    const {
      amount,
      recipientChain,
      recipient,
      // Default to 1 hour, sufficiently far in the future
      deadline = (await this.client.getBlock()).timestamp + BigInt(60 * 60 * 1),
      // Default to no fee
      arbiterFee = BigInt(0)
    } = params
    const from = (await this.walletClient.getAddress()) as Hex
    const nonce = await this.contract.nonces(from)
    const contractArgs = {
      from,
      amount,
      recipientChain: toChainId(recipientChain),
      recipient,
      arbiterFee,
      deadline,
      nonce
    }
    const typedData = await this.contract.getTransferTokensTypedData(
      contractArgs
    )
    const signature = await this.walletClient.signTypedData(typedData)
    const res = await this.contract.transferTokens({
      ...contractArgs,
      signature: signature as Hex
    })
    return await this.walletClient.sendTransaction(res.request)
  }
}
