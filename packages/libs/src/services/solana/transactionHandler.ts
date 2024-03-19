import {
  Transaction,
  PublicKey,
  Connection,
  Keypair,
  TransactionInstruction,
  TransactionMessage,
  AddressLookupTableAccount,
  VersionedTransaction
} from '@solana/web3.js'

import type { Logger, Nullable } from '../../utils'
import type { IdentityService, RelayTransactionData } from '../identity'

import { SolanaUtils } from './SolanaUtils'

type HandleTransactionParams = {
  instructions: TransactionInstruction[]
  errorMapping?: Nullable<{ fromErrorCode: (errorCode: number) => string }>
  recentBlockhash?: Nullable<string>
  logger?: Logger
  skipPreflight?: Nullable<boolean>
  feePayerOverride?: Nullable<PublicKey>
  sendBlockhash?: boolean
  signatures?: Nullable<Array<{ publicKey: string; signature: Buffer }>>
  lookupTableAddresses?: string[]
  retry?: boolean
}

/**
 * Handles sending Solana transactions, either directly via `sendAndConfirmTransaction`,
 * or via IdentityService's relay.
 */
export class TransactionHandler {
  private readonly connection: Connection
  private readonly useRelay: boolean
  private readonly identityService: IdentityService | null
  private readonly feePayerKeypairs: Keypair[] | null
  private readonly skipPreflight: boolean
  private readonly retryTimeoutMs: number
  private readonly pollingFrequencyMs: number
  private readonly sendingFrequencyMs: number

  /**
   * Creates an instance of TransactionHandler.
   */
  constructor({
    connection,
    useRelay,
    identityService = null,
    feePayerKeypairs = null,
    skipPreflight = true,
    retryTimeoutMs = 60000,
    pollingFrequencyMs = 300,
    sendingFrequencyMs = 300
  }: {
    connection: Connection
    useRelay: boolean
    identityService?: IdentityService | null
    feePayerKeypairs?: Keypair[] | null
    skipPreflight?: boolean
    retryTimeoutMs?: number
    pollingFrequencyMs?: number
    sendingFrequencyMs?: number
  }) {
    this.connection = connection
    this.useRelay = useRelay
    this.identityService = identityService
    this.feePayerKeypairs = feePayerKeypairs
    this.skipPreflight = skipPreflight
    this.retryTimeoutMs = retryTimeoutMs
    this.pollingFrequencyMs = pollingFrequencyMs
    this.sendingFrequencyMs = sendingFrequencyMs
  }

  /**
   * Primary method to send a Solana transaction.
   */
  async handleTransaction({
    instructions,
    errorMapping = null,
    recentBlockhash = null,
    logger = console,
    skipPreflight = false,
    feePayerOverride = null,
    sendBlockhash = false,
    signatures = null,
    lookupTableAddresses = [],
    retry = true
  }: HandleTransactionParams) {
    let result: {
      res: string | null
      errorCode: string | number | null
      error: string | null
    } | null = null
    if (this.useRelay) {
      result = await this._relayTransaction(
        instructions,
        recentBlockhash,
        skipPreflight,
        feePayerOverride,
        sendBlockhash,
        signatures,
        lookupTableAddresses,
        retry
      )
    } else {
      result = await this._locallyConfirmTransaction(
        instructions,
        recentBlockhash,
        logger,
        skipPreflight,
        feePayerOverride,
        signatures,
        lookupTableAddresses,
        retry
      )
    }
    if (result.error && result.errorCode !== null && errorMapping) {
      result.errorCode = errorMapping.fromErrorCode(result.errorCode as number)
    }
    return result
  }

  async _relayTransaction(
    instructions: TransactionInstruction[],
    recentBlockhash: string | null,
    skipPreflight: boolean | null,
    feePayerOverride: Nullable<PublicKey> = null,
    sendBlockhash: boolean,
    signatures: Array<{ publicKey: string; signature: Buffer }> | null,
    lookupTableAddresses: string[],
    retry: boolean
  ) {
    const relayable = instructions.map(SolanaUtils.prepareInstructionForRelay)

    const transactionData: RelayTransactionData = {
      signatures,
      instructions: relayable,
      skipPreflight:
        skipPreflight === null ? this.skipPreflight : skipPreflight,
      feePayerOverride: feePayerOverride ? feePayerOverride.toString() : null,
      lookupTableAddresses,
      retry
    }

    if (sendBlockhash || Array.isArray(signatures)) {
      transactionData.recentBlockhash =
        recentBlockhash ??
        (await this.connection.getLatestBlockhash('confirmed')).blockhash
    }

    try {
      const response = await this.identityService?.solanaRelay(transactionData)
      return {
        res: response?.transactionSignature ?? null,
        error: null,
        errorCode: null
      }
    } catch (e) {
      let error = null
      if (typeof e === 'object' && e !== null) {
        error = (e as any).response?.data?.error || (e as Error).message
      }
      const errorCode = error ? this._parseSolanaErrorCode(error) : null
      return { res: null, error, errorCode }
    }
  }

  async _locallyConfirmTransaction(
    instructions: TransactionInstruction[],
    recentBlockhash: string | null,
    logger: Logger,
    skipPreflight: boolean | null,
    feePayerOverride: Nullable<PublicKey | string> = null,
    signatures: Array<{ publicKey: string; signature: Buffer }> | null = null,
    lookupTableAddresses: string[],
    retry = true
  ) {
    const feePayerKeypairOverride = (() => {
      if (feePayerOverride && this.feePayerKeypairs) {
        const stringFeePayer = feePayerOverride.toString()
        return this.feePayerKeypairs.find(
          (keypair) => keypair.publicKey.toString() === stringFeePayer
        )
      }
      return null
    })()

    const feePayerAccount =
      feePayerKeypairOverride ?? this.feePayerKeypairs?.[0]
    const feePayerPubKey =
      feePayerAccount?.publicKey ??
      (feePayerOverride ? new PublicKey(feePayerOverride) : null)

    const alreadySigned = signatures?.some(
      (s) =>
        s.publicKey === feePayerOverride?.toString() &&
        !s.signature.every((b) => b === 0)
    )
    if (!feePayerPubKey || (!feePayerAccount && !alreadySigned)) {
      logger.error(
        'transactionHandler: Local feepayer keys missing for direct confirmation!'
      )
      return {
        res: null,
        error: 'Missing keys',
        errorCode: null
      }
    }

    // Get blockhash
    recentBlockhash =
      recentBlockhash ??
      (await this.connection.getLatestBlockhash('confirmed')).blockhash
    let rawTransaction: Buffer | Uint8Array

    // Branch on whether to send a legacy or v0 transaction. Some duplicated code
    // unfortunately due to type errors, eg `add` does not exist on VersionedTransaction.
    if (lookupTableAddresses.length > 0) {
      // Use v0 transaction if lookup table addresses were supplied
      const lookupTableAccounts: AddressLookupTableAccount[] = []
      // Need to use for loop instead of forEach to properly await async calls
      for (const address of lookupTableAddresses) {
        if (address === undefined) continue
        const lookupTableAccount = await this.connection.getAddressLookupTable(
          new PublicKey(address)
        )
        if (lookupTableAccount.value !== null) {
          lookupTableAccounts.push(lookupTableAccount.value)
        } else {
          // Abort if a lookup table account is missing because the resulting transaction
          // might be too large
          return {
            res: null,
            error: `Missing lookup table account for address ${address}`,
            errorCode: null
          }
        }
      }
      const message = new TransactionMessage({
        payerKey: feePayerPubKey,
        recentBlockhash,
        instructions
      }).compileToV0Message(lookupTableAccounts)
      const tx = new VersionedTransaction(message)
      if (feePayerAccount) {
        tx.sign([feePayerAccount])
      }
      if (Array.isArray(signatures)) {
        signatures.forEach(({ publicKey, signature }) => {
          tx.addSignature(new PublicKey(publicKey), signature)
        })
      }
      rawTransaction = tx.serialize()
    } else {
      // Otherwise send a legacy transaction
      const tx = new Transaction()
      tx.recentBlockhash = recentBlockhash
      instructions.forEach((i) => tx.add(i))
      tx.feePayer = feePayerPubKey
      if (feePayerAccount) {
        tx.sign(feePayerAccount)
      }
      if (Array.isArray(signatures)) {
        signatures.forEach(({ publicKey, signature }) => {
          tx.addSignature(new PublicKey(publicKey), signature)
        })
      }
      rawTransaction = tx.serialize()
    }

    // Send the txn
    const sendRawTransaction = async () => {
      return await this.connection.sendRawTransaction(rawTransaction, {
        skipPreflight:
          skipPreflight === null ? this.skipPreflight : skipPreflight,
        preflightCommitment: 'processed',
        maxRetries: retry ? 0 : undefined
      })
    }

    let txid
    try {
      txid = await sendRawTransaction()
    } catch (e) {
      // Rarely, this intiial send will fail
      logger.error(`transactionHandler: Initial send failed: ${e}`)
      let errorCode = null
      let error = null
      if (e instanceof Error) {
        error = e.message
        errorCode = this._parseSolanaErrorCode(error)
      }
      return {
        res: null,
        error,
        errorCode
      }
    }

    let done = false

    // Start up resubmission loop
    let sendCount = 0
    const startTime = Date.now()
    if (retry) {
      ;(async () => {
        let elapsed = Date.now() - startTime
        // eslint-disable-next-line no-unmodified-loop-condition
        while (!done && elapsed < this.retryTimeoutMs) {
          try {
            sendRawTransaction()
          } catch (e) {
            logger.error(
              `transactionHandler: error in send loop: ${e} for txId ${txid}`
            )
          }
          sendCount++
          await delay(this.sendingFrequencyMs)
          elapsed = Date.now() - startTime
        }
      })()
    }

    // Await for tx confirmation
    try {
      await this._awaitTransactionSignatureConfirmation(txid, logger)
      done = true
      logger.info(
        `transactionHandler: finished for txid ${txid} with ${sendCount} retries`
      )
      return {
        res: txid,
        error: null,
        errorCode: null
      }
    } catch (e) {
      logger.error(
        `transactionHandler: error in awaitTransactionSignature: ${JSON.stringify(
          e
        )}, ${txid}`
      )
      done = true
      let errorCode = null
      let error = null
      if (e instanceof Error) {
        error = e.message
        errorCode = this._parseSolanaErrorCode(error)
      }
      return {
        res: null,
        error,
        errorCode
      }
    }
  }

  async _awaitTransactionSignatureConfirmation(txid: string, logger: Logger) {
    let done = false

    const result = await new Promise((resolve, reject) => {
      ;(async () => {
        // Setup timeout if nothing else finishes
        setTimeout(() => {
          if (done) {
            return
          }
          done = true
          const message = `transactionHandler: Timed out in await, ${txid}`
          logger.error(message)
          reject(new Error(message))
        }, this.retryTimeoutMs)

        // Setup WS listener
        try {
          this.connection.onSignature(
            txid,
            (result) => {
              if (done) return
              done = true
              if (result.err) {
                const err = JSON.stringify(result.err)
                logger.error(
                  `transactionHandler: Error in onSignature ${txid}, ${err}`
                )
                reject(new Error(err))
              } else {
                resolve(txid)
              }
            },
            'processed'
          )
        } catch (e) {
          done = true
          logger.error(`transactionHandler: WS error in setup ${txid}, ${e}`)
        }

        // Setup polling
        while (!done) {
          ;(async () => {
            try {
              const signatureStatuses =
                await this.connection.getSignatureStatuses([txid])
              const result = signatureStatuses?.value[0]

              // Early return this iteration if already done, or no result
              if (done || !result) return

              // End loop if error
              if (result.err) {
                const err = JSON.stringify(result.err)
                logger.error(
                  `transactionHandler: polling saw result error: ${err}, tx: ${txid}`
                )
                done = true
                reject(new Error(err))
                return
              }

              // Early return if response without confirmation
              if (
                !(
                  (result.confirmations !== null &&
                    result.confirmations !== 0) ||
                  result.confirmationStatus === 'confirmed' ||
                  result.confirmationStatus === 'finalized'
                )
              ) {
                return
              }
              // Otherwise, we made it
              done = true
              resolve(txid)
            } catch (e) {
              if (!done) {
                logger.error(
                  `transactionHandler: REST polling connection error: ${e}, tx: ${txid}`
                )
              }
            }
          })()

          await delay(this.pollingFrequencyMs)
        }
      })()
    })
    done = true
    return result
  }

  /**
   * Attempts to parse an error code out of a message of the form:
   * "... custom program error: 0x1", where the return in this case would be the number 1.
   * Returns null for unparsable strings.
   */
  _parseSolanaErrorCode(errorMessage: string) {
    if (!errorMessage) return null
    // Match on custom solana program errors
    const matcher = /(?:custom program error: 0x)(.*)$/
    const res = errorMessage.match(matcher)
    if (res && res.length === 2)
      return res[1] ? parseInt(res[1], 16) || null : null
    // Match on custom anchor errors
    const matcher2 = /(?:"Custom":)(\d+)/
    const res2 = errorMessage.match(matcher2)
    if (res2 && res2.length === 2)
      return res2[1] ? parseInt(res2[1], 10) || null : null
    return null
  }
}

async function delay(ms: number) {
  return await new Promise((resolve) => setTimeout(resolve, ms))
}
