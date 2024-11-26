import { AudiusToken, AudiusTokenTypes } from '@audius/eth'
import {
  type GetTypedDataDomain,
  type Hex,
  type TypedDataDefinition,
  type PublicClient,
  hexToSignature,
  type WalletClient
} from 'viem'
import type { GetAccountParameter } from 'viem/_types/types/account'
import type { UnionOmit } from 'viem/_types/types/utils'
import { type FormattedTransactionRequest } from 'viem/utils'

import type { AudiusWalletClient } from '../../../AudiusWalletClient'

import type { AudiusTokenConfig } from './types'

const ONE_HOUR_IN_MS = 1000 * 60 * 60

export class AudiusTokenClient {
  private readonly audiusWalletClient: AudiusWalletClient
  private readonly walletClient: WalletClient
  private readonly publicClient: PublicClient
  private readonly contractAddress: Hex

  constructor(config: AudiusTokenConfig) {
    this.audiusWalletClient = config.audiusWalletClient
    this.walletClient = config.ethWalletClient
    this.publicClient = config.ethPublicClient
    this.contractAddress = config.address
  }

  public async permit(
    params: {
      args: {
        owner?: Hex
        spender: Hex
        value: bigint
        deadline?: bigint
      }
    } & GetAccountParameter &
      UnionOmit<FormattedTransactionRequest, 'from' | 'to' | 'data' | 'value'>
  ) {
    const {
      args: {
        owner = (await this.audiusWalletClient.getAddresses())[0],
        spender,
        value,
        deadline = BigInt(Date.now() + ONE_HOUR_IN_MS)
      },
      ...other
    } = params

    // Get args
    if (owner === undefined) {
      throw new Error(
        'Parameter "owner" could not be derived from wallet client.'
      )
    }
    const nonce = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: AudiusToken.abi,
      functionName: 'nonces',
      args: [owner]
    })

    // Sign the typed data with the user's Audius wallet
    const typedData: TypedDataDefinition<AudiusTokenTypes, 'Permit'> = {
      primaryType: 'Permit',
      domain: await this.domain(),
      message: { owner, spender, value, nonce, deadline },
      types: AudiusToken.types
    }
    const signature = await this.audiusWalletClient.signTypedData(typedData)
    const { r, s, v } = hexToSignature(signature)

    // Send the transaction on Ethereum
    const { request } = await this.publicClient.simulateContract({
      address: this.contractAddress,
      abi: AudiusToken.abi,
      functionName: 'permit',
      args: [owner, spender, value, deadline, Number(v), r, s] as const,
      ...other
    })
    return await this.walletClient.writeContract(request)
  }

  private async domain(): Promise<
    GetTypedDataDomain<AudiusTokenTypes>['domain']
  > {
    return {
      name: await this.publicClient.readContract({
        abi: AudiusToken.abi,
        address: this.contractAddress,
        functionName: 'name'
      }),
      chainId: BigInt(await this.publicClient.getChainId()),
      verifyingContract: this.contractAddress,
      version: '1'
    }
  }
}
