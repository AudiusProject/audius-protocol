const SolanaUtils = require('./utils')
const {
  Transaction,
  sendAndConfirmTransaction
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
  constructor ({ connection, useRelay, identityService = null, feePayerKeypairs = null, skipPreflight = true }) {
    this.connection = connection
    this.useRelay = useRelay
    this.identityService = identityService
    this.feePayerKeypairs = feePayerKeypairs
    this.skipPreflight = skipPreflight
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
  async handleTransaction ({ instructions, errorMapping = null, recentBlockhash = null, logger = console, skipPreflight = null, feePayerOverride = null, sendBlockhash = true }) {
    let result = null
    if (this.useRelay) {
      result = await this._relayTransaction(instructions, recentBlockhash, skipPreflight, feePayerOverride, sendBlockhash)
    } else {
      result = await this._locallyConfirmTransaction(instructions, recentBlockhash, logger, skipPreflight, feePayerOverride)
    }
    if (result.error && result.errorCode !== null && errorMapping) {
      result.errorCode = errorMapping.fromErrorCode(result.errorCode)
    }
    return result
  }

  async _relayTransaction (instructions, recentBlockhash, skipPreflight, feePayerOverride = null, sendBlockhash) {
    const relayable = instructions.map(SolanaUtils.prepareInstructionForRelay)

    const transactionData = {
      instructions: relayable,
      skipPreflight: skipPreflight === null ? this.skipPreflight : skipPreflight,
      feePayerOverride: feePayerOverride ? feePayerOverride.toString() : null
    }

    if (sendBlockhash) {
      transactionData.recentBlockhash = (recentBlockhash || (await this.connection.getRecentBlockhash('confirmed')).blockhash)
    }

    try {
      const response = await this.identityService.solanaRelay(transactionData)
      return { res: response, error: null, errorCode: null }
    } catch (e) {
      const error = e.response?.data?.error || e.message
      const errorCode = this._parseSolanaErrorCode(error)
      return { res: null, error, errorCode }
    }
  }

  async _locallyConfirmTransaction (instructions, recentBlockhash, logger, skipPreflight, feePayerOverride = null) {
    const feePayerKeypairOverride = (() => {
      if (feePayerOverride && this.feePayerKeypairs) {
        const stringFeePayer = feePayerOverride.toString()
        return this.feePayerKeypairs.find(keypair => keypair.publicKey.toString() === stringFeePayer)
      }
      return null
    })()

    const feePayerAccount = feePayerKeypairOverride || (this.feePayerKeypairs && this.feePayerKeypairs[0])
    if (!feePayerAccount) {
      console.error('Local feepayer keys missing for direct confirmation!')
      return {
        res: null,
        error: 'Missing keys',
        errorCode: null
      }
    }

    recentBlockhash = recentBlockhash || (await this.connection.getRecentBlockhash('confirmed')).blockhash
    const tx = new Transaction({ recentBlockhash })

    instructions.forEach(i => tx.add(i))

    tx.sign(feePayerAccount)

    try {
      const transactionSignature = await sendAndConfirmTransaction(
        this.connection,
        tx,
        [feePayerAccount],
        {
          skipPreflight: skipPreflight === null ? this.skipPreflight : skipPreflight,
          commitment: 'processed',
          preflightCommitment: 'processed'
        }
      )
      logger.info(`transactionHandler: signature: ${transactionSignature}`)
      return {
        res: transactionSignature,
        error: null,
        errorCode: null
      }
    } catch (e) {
      const { message: error } = e
      const errorCode = this._parseSolanaErrorCode(error)
      return {
        res: null,
        error,
        errorCode
      }
    }
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
