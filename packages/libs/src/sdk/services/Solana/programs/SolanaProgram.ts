import {
  Connection,
  PublicKey,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import type { SolanaWalletAdapter } from '../types'
import {
  BuildTransactionRequest,
  BuildTransactionSchema,
  type SolanaProgramConfigInternal
} from './types'
import { parseParams } from '../../../utils/parseParams'

const isPublicKeyArray = (arr: any[]): arr is PublicKey[] =>
  arr.every((a) => a instanceof PublicKey)

/**
 * Abstract class for initializing individual program clients.
 */
export class SolanaProgram {
  /** The endpoint for the Solana RPC. */
  protected readonly connection: Connection
  constructor(
    config: SolanaProgramConfigInternal,
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
