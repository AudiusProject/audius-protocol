import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import { BaseAPI } from '../../api/generated/default'
import * as runtime from '../../api/generated/default/runtime'
import { parseParams } from '../../utils/parseParams'
import {
  type RelayRequestBody,
  type SolanaConfig,
  type SolanaConfigInternal,
  RelayRequest,
  RelaySchema,
  BuildTransactionRequest,
  BuildTransactionSchema
} from './types'
import { mergeConfigWithDefaults } from '../../utils/mergeConfigs'
import { defaultSolanaConfig } from './constants'
import fetch from 'cross-fetch'
import { ClaimableTokens } from './programs/ClaimableTokens'

const isPublicKeyArray = (arr: any[]): arr is PublicKey[] =>
  arr.every((a) => a instanceof PublicKey)

export class Solana extends BaseAPI {
  /**
   * Nested service for interacting with the ClaimableTokensProgram.
   */
  public readonly ClaimableTokens: ClaimableTokens

  /**
   * Connection to interact with the Solana RPC.
   */
  private readonly connection: Connection

  /**
   * Configuration passed in by consumer (with defaults).
   */
  private readonly config: SolanaConfigInternal

  /**
   * Public key of the currently selected transaction fee payer
   * from the selected Discovery Node.
   */
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
    this.ClaimableTokens = new ClaimableTokens(
      {
        programId: this.config.programIds.claimableTokens,
        connection: this.connection,
        mints: this.config.mints
      },
      this
    )
  }

  /**
   * Gets a random fee payer public key from the selected discovery node's
   * Solana relay plugin.
   *
   * Used when relay transactions don't specify a fee payer override.
   */
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

  /**
   * Relays a transaction to the selected discovery node's Solana relay plugin.
   */
  async relay(
    params: RelayRequest,
    initOverrides?: RequestInit | runtime.InitOverrideFunction
  ) {
    const { transaction, confirmationOptions, sendOptions } = await parseParams(
      'relay',
      RelaySchema
    )(params)

    const headerParameters: runtime.HTTPHeaders = {}
    const body: RelayRequestBody = {
      transaction: Buffer.from(transaction.serialize()).toString('base64'),
      confirmationOptions,
      sendOptions
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

  /**
   * Convenience helper to construct v0 transactions.
   *
   * Handles fetching a recent blockhash, getting lookup table accounts,
   * and assigning a fee payer.
   */
  async buildTransaction(params: BuildTransactionRequest) {
    let {
      instructions,
      feePayer,
      recentBlockhash,
      addressLookupTables = []
    } = await parseParams('buildTransaction', BuildTransactionSchema)(params)

    if (!recentBlockhash) {
      const res = await this.connection.getLatestBlockhash()
      recentBlockhash = res.blockhash
    }

    let addressLookupTableAccounts = !isPublicKeyArray(addressLookupTables)
      ? addressLookupTables
      : await this.getLookupTableAccounts(addressLookupTables)

    const message = new TransactionMessage({
      payerKey: feePayer ?? (await this.getFeePayer()),
      recentBlockhash,
      instructions
    }).compileToV0Message(addressLookupTableAccounts)

    return new VersionedTransaction(message)
  }

  private async getLookupTableAccounts(lookupTableKeys: PublicKey[]) {
    return await Promise.all(
      lookupTableKeys.map(async (accountKey) => {
        const res = await this.connection.getAddressLookupTable(accountKey)
        if (res.value === null) {
          throw new Error(`Lookup table not found: ${accountKey.toBase58()}`)
        }
        return res.value
      })
    )
  }
}
