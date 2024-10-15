import type { PublicClient } from 'viem'

import { abi } from './abi'
import { AUDIUS_TOKEN_CONTRACT_ADDRESS } from './constants'

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

  balanceOf = ({ account }: { account: `0x${string}` }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'balanceOf',
      args: [account]
    })
}
