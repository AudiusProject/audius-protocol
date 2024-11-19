import {
  hexToSignature,
  type GetTypedDataMessage,
  type Hash,
  type PublicClient,
  type TypedDataDefinition
} from 'viem'

import { abi } from './abi'
import { AUDIUS_TOKEN_CONTRACT_ADDRESS, audiusTokenTypes } from './constants'
import type { AudiusTokenTypedData, PermitParams } from './types'

export class AudiusToken {
  client: PublicClient
  address: `0x${string}`

  constructor(
    client: PublicClient,
    { address }: { address?: `0x${string}` } = {}
  ) {
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

  public async permit({
    owner,
    spender,
    value,
    deadline,
    signature
  }: PermitParams) {
    const { r, s, v } = hexToSignature(signature)
    return await this.client.simulateContract({
      address: this.address,
      abi,
      functionName: 'permit',
      args: [owner, spender, value, deadline, Number(v), r, s]
    })
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
      chainId: await this.client.getChainId(),
      version: '1'
    }
  }
}
