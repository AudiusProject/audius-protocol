const SolanaUtils = require('./utils')
const {
  Transaction,
  PublicKey,
} = require('@solana/web3.js')

/**
 * Handles sending Solana transactions, either directly via `sendAndConfirmTransaction`,
 * or via IdentityService's relay.
 */
class TransactionHandler {
  /**
   * Creates an instance of TransactionHandler.
   *
   * @param {{
   *  connection: Connection,
   *  useRelay: boolean,
   *  identityService: Object,
   *  feePayerKeypairs: KeyPair[]
   *  skipPreflight: boolean
   * }} {
   *  connection,
   *  useRelay,
   *  identityService = null,
   *  feePayerKeypairs = null,
   *  skipPreflight = true
   * }
   * @memberof TransactionHandler
   */
  constructor ({
    connection,
    useRelay,
    identityService = null,
    feePayerKeypairs = null,
    skipPreflight = true,
    retryTimeoutMs = 60000,
    pollingFrequencyMs = 300,
    sendingFrequencyMs = 300
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
   *
   * @typedef {Object} HandleTransactionReturn
   * @property {Object} res the result
   * @property {string} [error=null] the optional error
   *  Will be a string if `errorMapping` is passed to the handler.
   * @property {string|number} [error_code=null] the optional error code.
   * @property {string} [recentBlockhash=null] optional recent blockhash to prefer over fetching
   * @property {boolean} [skipPreflight=null] optional per transaction override to skipPreflight
   * @property {any} [logger=console] optional logger
   * @property {any} [feePayerOverride=null] optional fee payer override
   *
   * @param {Array<TransactionInstruction>} instructions an array of `TransactionInstructions`
   * @param {*} [errorMapping=null] an optional error mapping. Should expose a `fromErrorCode` method.
   * @param {Array<{publicKey: string, signature: Buffer}>} [signature=null] optional signatures
   * @returns {Promise<HandleTransactionReturn>}
   * @memberof TransactionHandler
   */
  async handleTransaction ({ instructions, errorMapping = null, recentBlockhash = null, logger = console, skipPreflight = null, feePayerOverride = null, sendBlockhash = true, signatures = null, retry = true }) {
    let result = null
    if (this.useRelay) {
      result = await this._relayTransaction(instructions, recentBlockhash, skipPreflight, feePayerOverride, sendBlockhash, signatures, retry)
    } else {
      result = await this._locallyConfirmTransaction(instructions, recentBlockhash, logger, skipPreflight, feePayerOverride, signatures, retry)
    }
    if (result.error && result.errorCode !== null && errorMapping) {
      result.errorCode = errorMapping.fromErrorCode(result.errorCode)
    }
    return result
  }

  async _relayTransaction (
    instructions,
    recentBlockhash,
    skipPreflight,
    feePayerOverride = null,
    sendBlockhash,
    signatures,
    retry
  ) {
    const relayable = instructions.map(SolanaUtils.prepareInstructionForRelay)

    const transactionData = {
      signatures,
      instructions: relayable,
      skipPreflight:
        skipPreflight === null ? this.skipPreflight : skipPreflight,
      feePayerOverride: feePayerOverride ? feePayerOverride.toString() : null,
      retry
    }

    if (sendBlockhash || Array.isArray(signatures)) {
      transactionData.recentBlockhash = (recentBlockhash || (await this.connection.getLatestBlockhash('confirmed')).blockhash)
    }

    try {
      const response = await this.identityService.solanaRelay(transactionData)
      return { res: response, error: null, errorCode: null }
    } catch (e) {
      const error =
        (e.response && e.response.data && e.response.data.error) || e.message
      const errorCode = this._parseSolanaErrorCode(error)
      return { res: null, error, errorCode }
    }
  }

  async _locallyConfirmTransaction (instructions, recentBlockhash, logger, skipPreflight, feePayerOverride = null, signatures = null, retry = true) {
    const feePayerKeypairOverride = (() => {
      if (feePayerOverride && this.feePayerKeypairs) {
        const stringFeePayer = feePayerOverride.toString()
        return this.feePayerKeypairs.find(
          (keypair) => keypair.publicKey.toString() === stringFeePayer
        )
      }
      return null
    })()

    const feePayerAccount = feePayerKeypairOverride || (this.feePayerKeypairs && this.feePayerKeypairs[0])
    if (!feePayerAccount) {
      logger.error('transactionHandler: Local feepayer keys missing for direct confirmation!')
      return {
        res: null,
        error: 'Missing keys',
        errorCode: null
      }
    }

    // Get blockhash

    recentBlockhash =
      recentBlockhash ||
      (await this.connection.getLatestBlockhash('confirmed')).blockhash

    // Construct the txn

    const tx = new Transaction({ recentBlockhash })
    instructions.forEach((i) => tx.add(i))
    tx.feePayer = feePayerAccount.publicKey
    tx.sign(feePayerAccount)

    if (Array.isArray(signatures)) {
      signatures.forEach(({ publicKey, signature }) => {
        tx.addSignature(new PublicKey(publicKey), signature)
      })
    }

    const rawTransaction = tx.serialize()

    // Send the txn

    const sendRawTransaction = async () => {
      return this.connection.sendRawTransaction(rawTransaction, {
        skipPreflight:
          skipPreflight === null ? this.skipPreflight : skipPreflight,
        commitment: 'processed',
        preflightCommitment: 'processed',
        maxRetries: retry ? 0 : undefined
      })
    }

    let txid
    try {
      txid = await sendRawTransaction()
    } catch (e) {
      // Rarely, this intiial send will fail
      logger.warn(`transactionHandler: Initial send failed: ${e}`)
      const { message: error } = e
      const errorCode = this._parseSolanaErrorCode(error)
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
            logger.warn(`transactionHandler: error in send loop: ${e} for txId ${txid}`)
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
      logger.info(`transactionHandler: finished for txid ${txid} with ${sendCount} retries`)
      return {
        res: txid,
        error: null,
        errorCode: null
      }
    } catch (e) {
      logger.warn(`transactionHandler: error in awaitTransactionSignature: ${JSON.stringify(e)}, ${txid}`)
      done = true
      const { message: error } = e
      const errorCode = this._parseSolanaErrorCode(error)
      return {
        res: null,
        error,
        errorCode
      }
    }
  }

  async _awaitTransactionSignatureConfirmation (txid, logger) {
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
          logger.warn(message)
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
                logger.warn(`transactionHandler: Error in onSignature ${txid}, ${err}`)
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
                  result.confirmations ||
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
  _parseSolanaErrorCode (errorMessage) {
    if (!errorMessage) return null
    // Match on custom solana program errors
    const matcher = /(?:custom program error: 0x)(.*)$/
    const res = errorMessage.match(matcher)
    if (res && res.length === 2) return parseInt(res[1], 16) || null
    // Match on custom anchor errors
    const matcher2 = /(?:"Custom":)(\d+)/
    const res2 = errorMessage.match(matcher2)
    if (res2 && res2.length === 2) return parseInt(res2[1], 10) || null
    return null
  }
}

async function delay (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = { TransactionHandler }
