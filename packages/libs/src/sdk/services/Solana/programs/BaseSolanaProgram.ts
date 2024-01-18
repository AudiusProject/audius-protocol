import {
  Commitment,
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'

import { parseParams } from '../../../utils/parseParams'
import type { SolanaWalletAdapter } from '../types'

import {
  BuildTransactionRequest,
  BuildTransactionSchema,
  type BaseSolanaProgramConfigInternal
} from './types'

const isPublicKeyArray = (arr: any[]): arr is PublicKey[] =>
  arr.every((a) => a instanceof PublicKey)

/**
 * Abstract class for initializing individual program clients.
 */
export class BaseSolanaProgram {
  /** The endpoint for the Solana RPC. */
  protected readonly connection: Connection
  constructor(
    config: BaseSolanaProgramConfigInternal,
    protected wallet: SolanaWalletAdapter
  ) {
    this.connection = new Connection(config.rpcEndpoint, config.rpcConfig)
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
      addressLookupTables = []
    } = await parseParams('buildTransaction', BuildTransactionSchema)(params)

    if (!recentBlockhash) {
      const res = await this.connection.getLatestBlockhash()
      recentBlockhash = res.blockhash
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
   * Gets the fee payer from the connected wallet.
   */
  protected async getFeePayer() {
    if (!this.wallet.connected) {
      await this.wallet.connect()
    }
    return this.wallet.publicKey!
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
