import {
  PublicClient,
  hexToSignature,
  type GetTypedDataMessage,
  type Hash,
  type TypedDataDefinition
} from 'viem'

import { abi } from './abi'
import {
  WORMHOLE_CLIENT_CONTRACT_ADDRESS,
  wormholeClientTypes
} from './constants'
import type { TransferTokensParams, WormholeClientTypedData } from './types'

export class Wormhole {
  private readonly client: PublicClient
  private readonly address: Hash

  constructor(client: PublicClient, { address }: { address?: Hash } = {}) {
    this.client = client
    this.address = address ?? WORMHOLE_CLIENT_CONTRACT_ADDRESS
  }

  public async getTransferTokensTypedData(
    args: GetTypedDataMessage<
      WormholeClientTypedData,
      'TransferTokens'
    >['message']
  ): Promise<TypedDataDefinition<WormholeClientTypedData, 'TransferTokens'>> {
    return {
      primaryType: 'TransferTokens',
      domain: await this.getDomain(),
      types: wormholeClientTypes,
      message: args
    }
  }

  public async transferTokens({
    from,
    amount,
    recipientChain,
    recipient,
    arbiterFee,
    deadline,
    signature
  }: TransferTokensParams) {
    const { r, s, v } = hexToSignature(signature)
    return await this.client.simulateContract({
      address: this.address,
      abi,
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
      ]
    })
  }

  public async nonces(from: Hash) {
    return await this.client.readContract({
      address: this.address,
      abi,
      functionName: 'nonces',
      args: [from]
    })
  }

  private async getDomain() {
    return {
      name: 'AudiusWormholeClient',
      verifyingContract: this.address,
      chainId: BigInt(await this.client.getChainId()),
      version: '1'
    }
  }
}
