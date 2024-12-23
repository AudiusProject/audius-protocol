import { AudiusWormhole, type AudiusWormholeTypes } from '@audius/eth'
import {
  type Hex,
  type PublicClient,
  type TypedDataDefinition,
  type WalletClient,
  parseSignature
} from 'viem'

import { parseParams } from '../../../../utils/parseParams'
import type { AudiusWalletClient } from '../../../AudiusWalletClient'

import {
  TransferTokensSchema,
  type TransferTokensParams,
  type AudiusWormholeConfig
} from './types'

const ONE_HOUR_IN_S = 60 * 60

export class AudiusWormholeClient {
  public readonly contractAddress: Hex

  private readonly audiusWalletClient: AudiusWalletClient
  private readonly walletClient: WalletClient
  private readonly publicClient: PublicClient

  constructor(config: AudiusWormholeConfig) {
    this.audiusWalletClient = config.audiusWalletClient
    this.walletClient = config.ethWalletClient
    this.publicClient = config.ethPublicClient
    this.contractAddress = config.address
  }

  async transferTokens(params: TransferTokensParams) {
    const {
      args: {
        from = (await this.audiusWalletClient.getAddresses())[0],
        amount,
        recipientChain,
        recipient,
        deadline = BigInt(Math.round(Date.now() / 1000) + ONE_HOUR_IN_S),
        arbiterFee = BigInt(0)
      },
      ...other
    } = await parseParams('transferTokens', TransferTokensSchema)(params)

    // Get args
    if (from === undefined) {
      throw new Error(
        'Parameter "from" could not be derived from wallet client.'
      )
    }
    const nonce = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: AudiusWormhole.abi,
      functionName: 'nonces',
      args: [from]
    })

    // Sign the typed data with the user's Audius wallet
    const typedData: TypedDataDefinition<
      AudiusWormholeTypes,
      'TransferTokens'
    > = {
      primaryType: 'TransferTokens',
      domain: await this.domain(),
      message: {
        from,
        amount,
        recipientChain,
        recipient,
        artbiterFee: arbiterFee,
        deadline,
        nonce
      },
      types: AudiusWormhole.types
    }
    const signature = await this.audiusWalletClient.signTypedData(typedData)
    const { r, s, v } = parseSignature(signature)

    // Send the transaction on Ethereum
    const { request } = await this.publicClient.simulateContract({
      address: this.contractAddress,
      abi: AudiusWormhole.abi,
      functionName: 'transferTokens',
      args: [
        from,
        amount,
        recipientChain,
        recipient,
        arbiterFee,
        deadline,
        Number(v),
        r,
        s
      ],
      ...other
    })
    return await this.walletClient.writeContract(request)
  }

  private async domain(): Promise<
    TypedDataDefinition<AudiusWormholeTypes, 'EIP712Domain'>['domain']
  > {
    return {
      name: 'AudiusWormholeClient',
      chainId: BigInt(await this.publicClient.getChainId()),
      verifyingContract: this.contractAddress,
      version: '1'
    }
  }
}
