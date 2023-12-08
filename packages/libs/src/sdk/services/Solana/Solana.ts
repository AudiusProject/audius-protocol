import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction
} from '@solana/web3.js'
import { BaseAPI } from '../../api/generated/default'
import * as runtime from '../../api/generated/default/runtime'
import { parseParams } from '../../utils/parseParams'
import {
  type RelayRequestBody,
  type SolanaConfig,
  type SolanaConfigInternal,
  RelayRequest,
  RelaySchema
} from './types'
import { mergeConfigWithDefaults } from '../../utils/mergeConfigs'
import { defaultSolanaConfig } from './constants'
import fetch from 'cross-fetch'
import { ClaimableTokens } from './ClaimableTokens'

export class Solana extends BaseAPI {
  public readonly ClaimableTokens: ClaimableTokens
  public readonly connection: Connection
  public readonly config: SolanaConfigInternal
  private feePayer: PublicKey | null = null

  constructor(config?: SolanaConfig) {
    super(
      new runtime.Configuration({
        fetchApi: fetch,
        basePath: '/solana',
        headers: { 'Content-Type': 'application/json' },
        middleware: config?.middleware
      })
    )
    this.config = mergeConfigWithDefaults(config, defaultSolanaConfig)
    this.connection = new Connection(
      this.config.rpcEndpoint,
      this.config.rpcConfig
    )
    this.ClaimableTokens = new ClaimableTokens(this)
  }

  async getFeePayer(
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ) {
    if (this.feePayer !== null) {
      return this.feePayer
    }
    const headerParameters: runtime.HTTPHeaders = {}
    const response = await this.request(
      {
        path: '/feePayer',
        method: 'GET',
        headers: headerParameters
      },
      initOverrides
    )
    const { feePayer } = await new runtime.JSONApiResponse(
      response,
      (json) => ({
        feePayer: !runtime.exists(json, 'feePayer')
          ? undefined
          : new PublicKey(json['feePayer'] as string)
      })
    ).value()
    if (!feePayer) {
      throw new Error('Failed to get fee payer!')
    }
    this.feePayer = feePayer
    return this.feePayer
  }

  async relay(
    params: RelayRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ) {
    const args = await parseParams('relay', RelaySchema)(params)
    const { confirmationOptions } = args

    const buildTransaction = async (
      instructions: TransactionInstruction[],
      feePayer?: PublicKey,
      blockhash?: string
    ) => {
      let recentBlockhash = blockhash
      if (!recentBlockhash) {
        const res = await this.connection.getLatestBlockhash()
        recentBlockhash = res.blockhash
      }
      const message = new TransactionMessage({
        payerKey: feePayer ?? (await this.getFeePayer()),
        recentBlockhash,
        instructions
      }).compileToLegacyMessage()
      return new VersionedTransaction(message)
    }

    const transaction =
      'transaction' in args
        ? args.transaction
        : await buildTransaction(
            args.instructions,
            args.feePayer,
            confirmationOptions?.confirmationStrategy?.blockhash
          )

    const headerParameters: runtime.HTTPHeaders = {}
    const body: RelayRequestBody = {
      transaction: Buffer.from(transaction.serialize()).toString('base64'),
      confirmationOptions
    }

    const response = await this.request(
      {
        path: '/relay',
        method: 'POST',
        headers: headerParameters,
        body: body
      },
      initOverrides
    )

    return await new runtime.JSONApiResponse(response, (json) => ({
      signature: !runtime.exists(json, 'signature')
        ? undefined
        : (json['signature'] as string)
    })).value()
  }
}
