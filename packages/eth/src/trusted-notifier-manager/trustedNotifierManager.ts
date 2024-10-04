import type { PublicClient } from 'viem'

import { abi } from './abi'
import { TRUSTED_NOTIFIER_MANAGER_CONTRACT_ADDRESS } from './constants'

export class TrustedNotifierManager {
  client: PublicClient
  address: `0x${string}`

  constructor(
    client: PublicClient,
    { address }: { address?: `0x${string}` } = {}
  ) {
    this.client = client
    this.address = address ?? TRUSTED_NOTIFIER_MANAGER_CONTRACT_ADDRESS
  }

  getLatestNotifierID = () =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getLatestNotifierID'
    })

  getNotifierForID = ({ id }: { id: bigint }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getNotifierForID',
      args: [id]
    })

  getNotifierForWallet = ({ address }: { address: `0x${string}` }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getNotifierForWallet',
      args: [address]
    })

  getNotifierForEndpoint = ({ endpoint }: { endpoint: string }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getNotifierForEndpoint',
      args: [endpoint]
    })

  getNotifierForEmail = ({ email }: { email: string }) =>
    this.client.readContract({
      address: this.address,
      abi,
      functionName: 'getNotifierForEmail',
      args: [email]
    })
}
