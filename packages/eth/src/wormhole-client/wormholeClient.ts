import {
  PublicClient,
  hexToSignature,
  type GetTypedDataMessage,
  type Hash,
  type TypedData,
  type TypedDataDefinition
} from 'viem'

import { abi } from './abi'
import { WORMHOLE_CLIENT_CONTRACT_ADDRESS } from './constants'

const types = {
  TransferTokens: [
    { name: 'from', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'recipientChain', type: 'uint16' },
    { name: 'recipient', type: 'bytes32' },
    { name: 'arbiterFee', type: 'uint256' },
    { name: 'nonce', type: 'uint32' },
    { name: 'deadline', type: 'uint256' }
  ]
} as const satisfies TypedData

type WormholeClientTypedData = typeof types

type TransferTokensParams = GetTypedDataMessage<
  WormholeClientTypedData,
  'TransferTokens'
>['message'] & { signature: Hash }

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
      types,
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
      chainId: await this.client.getChainId(),
      version: '1'
    }
  }
}
