import { AudiusWormhole, type AudiusWormholeTypes } from '@audius/eth'
import {
  hexToSignature,
  type GetTypedDataDomain,
  type Hex,
  type PublicClient,
  type TypedDataDefinition,
  type WalletClient
} from 'viem'

import { parseParams } from '../../../../utils/parseParams'
import type { AudiusWalletClient } from '../../../AudiusWalletClient'

import {
  TransferTokensSchema,
  type TransferTokensParams,
  type AudiusWormholeConfig
} from './types'

const ONE_HOUR_IN_MS = 1000 * 60 * 60

export class AudiusWormholeClient {
  private readonly audiusWalletClient: AudiusWalletClient
  private readonly walletClient: WalletClient
  private readonly publicClient: PublicClient
  private readonly contractAddress: Hex

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
        deadline = BigInt(Date.now() + ONE_HOUR_IN_MS),
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
        arbiterFee,
        deadline,
        nonce
      },
      types: AudiusWormhole.types
    }
    const signature = await this.audiusWalletClient.signTypedData(typedData)
    const { r, s, v } = hexToSignature(signature)

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
    GetTypedDataDomain<AudiusWormholeTypes>['domain']
  > {
    return {
      name: 'AudiusWormholeClient',
      chainId: BigInt(await this.publicClient.getChainId()),
      verifyingContract: this.contractAddress,
      version: '1'
    }
  }
}
