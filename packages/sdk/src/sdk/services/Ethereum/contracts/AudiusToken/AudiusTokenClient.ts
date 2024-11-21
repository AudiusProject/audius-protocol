import { AudiusToken } from '@audius/eth'
import { type Hex, encodeFunctionData, hexToSignature } from 'viem'

import type {
  AudiusWalletClient,
  TransactionRequest
} from '../../../AudiusWalletClient'
import { EthereumContract } from '../EthereumContract'

import type { AudiusTokenConfig } from './types'

export class AudiusTokenClient extends EthereumContract {
  private readonly contract: AudiusToken
  private readonly walletClient: AudiusWalletClient

  constructor(config: AudiusTokenConfig) {
    super(config)

    this.contract = new AudiusToken(config.client)
    this.walletClient = config.walletClient
  }

  public async permit(
    params: {
      args: {
        owner?: Hex
        spender: Hex
        value: bigint
        deadline?: bigint
      }
    } & Omit<TransactionRequest, 'data' | 'to'>
  ) {
    const {
      args: { owner: owner_, spender, value, deadline: deadline_ },
      ...transactionRequest
    } = params
    const owner = owner_ ?? ((await this.walletClient.getAddress()) as Hex)
    const deadline = deadline_ ?? BigInt(Date.now() + 1000 * 60 * 60)
    const nonce = await this.contract.nonces(owner)
    const signedArgs = { owner, spender, value, nonce, deadline }
    const typedData = await this.contract.getPermitTypedData(signedArgs)
    const signature = await this.walletClient.signTypedData(typedData)
    const { r, s, v } = hexToSignature(signature as Hex)
    const args = [owner, spender, value, deadline, Number(v), r, s] as const
    const data = encodeFunctionData({
      abi: this.contract.abi,
      functionName: 'permit',
      args
    })
    return await this.walletClient.sendTransaction({
      data,
      to: this.contract.address,
      ...transactionRequest
    })
  }
}
