const SolanaUtils = require('./utils')
const { Transaction } = require('@solana/web3.js')

// TODO: move this into a util
async function delay (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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
   * @returns {Promise<HandleTransactionReturn>}
   * @memberof TransactionHandler
   */
  async handleTransaction ({
    instructions,
    errorMapping = null,
    recentBlockhash = null,
    logger = console,
    skipPreflight = null,
    feePayerOverride = null,
    sendBlockhash = true,
    retry = true
  }) {
    let result = null
    if (this.useRelay) {
      result = await this._relayTransaction(
        instructions,
        recentBlockhash,
        skipPreflight,
        feePayerOverride,
        sendBlockhash,
        retry
      )
    } else {
      result = await this._locallyConfirmTransaction(
        instructions,
        recentBlockhash,
        logger,
        skipPreflight,
        feePayerOverride,
        retry
      )
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
    retry
  ) {
    const relayable = instructions.map(SolanaUtils.prepareInstructionForRelay)

    const transactionData = {
      instructions: relayable,
      skipPreflight:
        skipPreflight === null ? this.skipPreflight : skipPreflight,
      feePayerOverride: feePayerOverride ? feePayerOverride.toString() : null,
      retry
    }

    if (sendBlockhash) {
      transactionData.recentBlockhash =
        recentBlockhash ||
        (await this.connection.getLatestBlockhash('confirmed')).blockhash
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

  async _locallyConfirmTransaction (
    instructions,
    recentBlockhash,
    logger,
    skipPreflight,
    feePayerOverride = null,
    retry
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
      feePayerKeypairOverride ||
      (this.feePayerKeypairs && this.feePayerKeypairs[0])
    if (!feePayerAccount) {
      console.error('Local feepayer keys missing for direct confirmation!')
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
    tx.sign(feePayerAccount)
    const rawTransaction = tx.serialize()

    // Send the txn
    const txid = await this.connection.sendRawTransaction(rawTransaction, {
      skipPreflight:
        skipPreflight === null ? this.skipPreflight : skipPreflight,
      commitment: 'processed',
      preflightCommitment: 'processed', // TODO: do we want this?
      maxRetries: retry ? 0 : undefined
    })

    let done = false

    const startTime = Date.now()
    if (retry) {
      ;(async () => {
        let elapsed = Date.now() - startTime
        let sendCount = 0
        // eslint-disable-next-line no-unmodified-loop-condition
        while (!done && elapsed < this.retryTimeoutMs) {
          this.connection.sendRawTransaction(rawTransaction, {
            skipPreflight:
              skipPreflight === null ? this.skipPreflight : skipPreflight,
            commitment: 'processed',
            preflightCommitment: 'processed', // TODO: do we want this?
            maxRetries: retry ? 0 : undefined
          })
          sendCount++
          if (sendCount % 10 === 0) {
            logger.info(`Send count ${sendCount}`)
          }
          await delay(this.sendingFrequencyMs)
          elapsed = Date.now() - startTime
        }
      })()
    }
    try {
      await this._awaitTransactionSignatureConfirmation(txid, logger)
      done = true
      return {
        res: txid,
        error: null,
        errorCode: null
      }
    } catch (e) {
      done = true
      const { message: error } = e
      const errorCode = this._parseSolanaErrorCode(error)
      return {
        res: null,
        error,
        errorCode
      }
    }

    // try {
    //   const transactionSignature = await sendAndConfirmTransaction(
    //     this.connection,
    //     tx,
    //     [feePayerAccount],
    //     {
    //       skipPreflight: skipPreflight === null ? this.skipPreflight : skipPreflight,
    //       commitment: 'processed',
    //       preflightCommitment: 'processed'
    //     }
    //   )
    //   logger.info(`transactionHandler: signature: ${transactionSignature}`)
    //   return {
    //     res: transactionSignature,
    //     error: null,
    //     errorCode: null
    //   }
    // } catch (e) {
    //   const { message: error } = e
    //   const errorCode = this._parseSolanaErrorCode(error)
    //   return {
    //     res: null,
    //     error,
    //     errorCode
    //   }
    // }
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
          logger.warn('transactionHandler: Timed out in await!')
          reject(new Error(`Timed out for txid ${txid}`))
        }, this.retryTimeoutMs)

        // Setup WS listener
        try {
          this.connection.onSignature(
            txid,
            (result) => {
              done = true
              if (result.err) {
                logger.warn('transactionHandler: Error in onSignature')
                reject(result.err)
              } else {
                logger.warn('transactionHandler: Success in onSignature!')
                resolve(result)
              }
            },
            this.connection.commitment // TODO: is this right?
          )
        } catch (e) {
          done = true
          logger.error('transactionHandler: WS error in setup', txid, e)
        }

        // Setup polling
        let pollCount = 0
        while (!done) {
          ;(async () => {
            try {
              if (pollCount % 10 === 0) {
                logger.info(`Poll count: ${pollCount}`)
              }
              pollCount++

              const signatureStatuses =
                await this.connection.getSignatureStatuses([txid])
              const result = signatureStatuses?.value[0]
              // Early return this iteration if done or no result
              if (done || !result) {
                logger.warn(
                  'transactionHandler: early return in polling from done or no result'
                )
                return
              }

              // End loop if error
              if (result.err) {
                logger.error(
                  `transactionHandler: polling error: ${result.err}, tx: ${txid}`
                )
                done = true
                reject(result.err)
              }

              // Early return if response without confirmation
              if (
                !(
                  result.confirmations ||
                  result.confirmationStatus === 'confirmed' ||
                  result.confirmationStatus === 'finalized'
                )
              ) {
                logger.warn(
                  'transactionHandler: early return in polling from missing confirmations'
                )
                return
              }

              // Otherwise, we made it
              done = true
              logger.info('Success in polling route!')
              resolve(result)
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
    const matcher = /(?:custom program error: 0x)(.*)$/
    const res = errorMessage.match(matcher)
    if (!res || !res.length === 2) return null
    return parseInt(res[1], 16) || null
  }
}

module.exports = { TransactionHandler }
