import {
  type GetTypedDataMessage,
  type Hash,
  type Hex,
  type PublicClient,
  type TypedDataDefinition
} from 'viem'

import { abi } from './abi'
import { AUDIUS_TOKEN_CONTRACT_ADDRESS, audiusTokenTypes } from './constants'
import type { AudiusTokenTypedData } from './types'

export class AudiusToken {
  public readonly abi = abi
  public readonly address: Hex

  private readonly client: PublicClient

  constructor(client: PublicClient, { address }: { address?: Hex } = {}) {
    this.client = client
    this.address = address ?? AUDIUS_TOKEN_CONTRACT_ADDRESS
  }

  public async balanceOf({ account }: { account: `0x${string}` }) {
    return await this.client.readContract({
      address: this.address,
      abi,
      functionName: 'balanceOf',
      args: [account]
    })
  }

  public async getPermitTypedData(
    args: GetTypedDataMessage<AudiusTokenTypedData, 'Permit'>['message']
  ): Promise<TypedDataDefinition<AudiusTokenTypedData, 'Permit'>> {
    return {
      primaryType: 'Permit',
      domain: await this.getDomain(),
      types: audiusTokenTypes,
      message: args
    }
  }

  public async name() {
    return await this.client.readContract({
      address: this.address,
      abi,
      functionName: 'name'
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
      name: await this.name(),
      verifyingContract: this.address,
      chainId: BigInt(await this.client.getChainId()),
      version: '1'
    }
  }
}
