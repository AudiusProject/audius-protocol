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
   *  feePayerKeypair: KeyPair
   * }} {
   *  connection,
   *  useRelay,
   *  identityService = null,
   *  feePayerKeypair = null
   * }
   * @memberof TransactionHandler
   */
  constructor ({ connection, useRelay, identityService = null, feePayerKeypair = null }) {
    this.connection = connection
    this.useRelay = useRelay
    this.identityService = identityService
    this.feePayerKeypair = feePayerKeypair
  }

  /**
   * Primary method to send a Solana transaction.
   *
   * @typedef {Object} HandleTransactionReturn
   * @property {Object} res the result
   * @property {string} [error=null] the optional error
   * @property {string|number} [error_code=null] the optional error code.
   *  Will be a string if `errorMapping` is passed to the handler.
   *
   * @param {Array<TransactionInstruction>} instructions an array of `TransactionInstructions`
   * @param {*} [errorMapping=null] an optional error mapping. Should expose a `fromErrorCode` method.
   * @returns {Promise<HandleTransactionReturn>}
   * @memberof TransactionHandler
   */
  async handleTransaction (instructions, errorMapping = null) {
    let result = null
    if (this.useRelay) {
      result = await this._relayTransaction(instructions)
    } else {
      result = await this._locallyConfirmTransaction(instructions)
    }
    if (result.errorCode !== null && errorMapping) {
      result.errorCode = errorMapping.fromErrorCode(result.errorCode)
    }
    return result
  }

  async _relayTransaction (instructions) {
    const relayable = instructions.map(SolanaUtils.prepareInstructionForRelay)

    const transactionData = {
      instructions: relayable
    }

    try {
      const response = await this.identityService.solanaRelay(transactionData)
      return { res: response, error: null, errorCode: null }
    } catch (e) {
      const { errorCode, error } = e.response.data
      return { res: null, error, errorCode }
    }
  }

  async _locallyConfirmTransaction (instructions) {
    if (!this.feePayerKeypair) {
      console.error('Local feepayer keys missing for direct confirmation!')
      return {
        res: null,
        error: 'Missing keys',
        errorCode: null
      }
    }

    const { blockhash: recentBlockhash } = await this.connection.getRecentBlockhash()
    const tx = new Transaction({ recentBlockhash })

    instructions.forEach(i => tx.add(i))

    tx.sign(this.feePayerKeypair)

    try {
      const transactionSignature = await sendAndConfirmTransaction(
        this.connection,
        tx,
        [this.feePayerKeypair],
        {
          skipPreflight: false,
          commitment: 'processed',
          preflightCommitment: 'processed'
        }
      )
      return transactionSignature
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
    const matcher = /(?<=custom program error: 0x)(.*)$/
    const res = errorMessage.match(matcher)
    if (!res || !res.length) return null
    return parseInt(res[0], 16) || null
  }
}

module.exports = { TransactionHandler }
