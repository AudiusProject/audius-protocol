import {
  Commitment,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import { z } from 'zod'

import { productionConfig } from '../../../config/production'
import { mergeConfigWithDefaults } from '../../../utils/mergeConfigs'
import { parseParams } from '../../../utils/parseParams'
import type { SolanaWalletAdapter } from '../types'

import { getDefaultSolanaClientConfig } from './getDefaultConfig'
import {
  BuildTransactionRequest,
  BuildTransactionSchema,
  PrioritySchema,
  type SolanaClientConfig
} from './types'

const isPublicKeyArray = (arr: any[]): arr is PublicKey[] =>
  arr.every((a) => a instanceof PublicKey)

const priorityToPercentileMap: Record<
  z.infer<typeof PrioritySchema>,
  number
> = {
  MIN: 0,
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  VERY_HIGH: 95,
  UNSAFE_MAX: 100
}

/**
 * This service is the main interaction source with Solana. It includes the
 * RPC client connection and the wallet adapter.
 *
 * The service contains helpful primitives for helping build, send, and confirm
 * transactions.
 */
export class SolanaClient {
  /** The Solana RPC client. */
  public readonly connection: Connection
  private readonly wallet: SolanaWalletAdapter
  constructor(config: SolanaClientConfig) {
    const configWithDefaults = mergeConfigWithDefaults(
      config,
      getDefaultSolanaClientConfig(productionConfig)
    )
    if (!configWithDefaults.rpcEndpoints[0]) {
      throw new Error('RPC Endpoints not configured')
    }
    this.connection = new Connection(
      // Only supports one RPC endpoint right now
      configWithDefaults.rpcEndpoints[0],
      configWithDefaults.rpcConfig
    )
    this.wallet = config.solanaWalletAdapter
  }

  /**
   * Convenience helper to construct v0 transactions.
   *
   * Handles fetching a recent blockhash, getting lookup table accounts,
   * and assigning a fee payer.
   */
  public async buildTransaction(params: BuildTransactionRequest) {
    let {
      instructions,
      feePayer,
      recentBlockhash,
      addressLookupTables = [],
      priorityFee = { priority: 'VERY_HIGH', minimumMicroLamports: 150_000 }
    } = await parseParams('buildTransaction', BuildTransactionSchema)(params)

    if (!recentBlockhash) {
      const res = await this.connection.getLatestBlockhash()
      recentBlockhash = res.blockhash
    }

    if (priorityFee) {
      if ('microLamports' in priorityFee) {
        instructions.push(
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: priorityFee.microLamports
          })
        )
      } else {
        const res = await this.connection.getRecentPrioritizationFees()
        const orderedFees = res
          .map((r) => r.prioritizationFee)
          .sort((a, b) => a - b)
        const percentile =
          'percentile' in priorityFee
            ? priorityFee.percentile
            : priorityToPercentileMap[priorityFee.priority]
        const percentileIndex = Math.max(
          Math.round((percentile / 100.0) * orderedFees.length - 1),
          0
        )
        const microLamports = Math.max(
          orderedFees[percentileIndex] ?? 0,
          priorityFee.minimumMicroLamports ?? 0
        )
        if (microLamports !== undefined) {
          instructions.push(
            ComputeBudgetProgram.setComputeUnitPrice({
              microLamports
            })
          )
        }
      }
    }

    const addressLookupTableAccounts = !isPublicKeyArray(addressLookupTables)
      ? addressLookupTables
      : await this.getLookupTableAccounts(addressLookupTables)

    const message = new TransactionMessage({
      payerKey: feePayer ?? (await this.getFeePayer()),
      recentBlockhash,
      instructions
    }).compileToV0Message(addressLookupTableAccounts)

    return new VersionedTransaction(message)
  }

  /**
   * Sends a transaction using the connected wallet adapter and the connection.
   * @param transaction The transaction to send.
   * @param sendOptions The options to send it with.
   */
  public async sendTransaction(
    transaction: Parameters<SolanaWalletAdapter['sendTransaction']>[0],
    sendOptions?: Parameters<SolanaWalletAdapter['sendTransaction']>[2]
  ) {
    return await this.wallet.sendTransaction(
      transaction,
      this.connection,
      sendOptions
    )
  }

  /**
   * Confirms all the transactions provided
   */
  public async confirmAllTransactions(
    signatures: string[],
    commitment: Commitment = 'confirmed'
  ) {
    const { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash()
    const results = await Promise.all(
      signatures.map(async (signature) => {
        const res = await this.connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight
          },
          commitment
        )
        return { signature, err: res.value.err }
      })
    )
    const errors = results.filter((r) => !!r.err)
    if (errors.length > 0) {
      throw new Error(
        `Failed to confirm transactions: ${errors
          .map((e) => `${e.signature}: ${e.err}`)
          .join(', ')}`
      )
    }
  }

  /**
   * Gets the fee payer from the connected wallet.
   */
  public async getFeePayer() {
    if (!this.wallet.connected) {
      await this.wallet.connect()
    }
    return this.wallet.publicKey!
  }

  /**
   * Normalizes the instructions as TransactionInstruction whether from
   * versioned transactions or legacy transactions.
   */
  public async getInstructions(
    transaction: VersionedTransaction | Transaction
  ) {
    if ('version' in transaction) {
      const lookupTableAccounts = await this.getLookupTableAccounts(
        transaction.message.addressTableLookups.map((k) => k.accountKey)
      )
      const decompiled = TransactionMessage.decompile(transaction.message, {
        addressLookupTableAccounts: lookupTableAccounts
      })
      return decompiled.instructions
    } else {
      return transaction.instructions
    }
  }

  /**
   * Fetches the address look up tables for populating transaction objects
   */
  public async getLookupTableAccounts(lookupTableKeys: PublicKey[]) {
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