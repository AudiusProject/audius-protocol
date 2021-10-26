const SolanaUtils = require('./utils')
const {
  Transaction,
  sendAndConfirmTransaction
} = require('@solana/web3.js')

// Should return
// { signature, error }
class TransactionHandler {
  constructor ({ connection, useRelay, identityService = null, feePayerKeypair = null }) {
    this.connection = connection
    this.useRelay = useRelay
    this.identityService = identityService
    this.feePayerKeypair = feePayerKeypair
  }

  async handleTransaction (instructions, errorMapping = null) {
    let result = null
    if (this.useRelay) {
      result = await this._relayTransaction(instructions)
    } else {
      result = await this._locallyConfirmTransaction(instructions)
    }
    if (result.errorCode && errorMapping) {
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
        errorCode: -1
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
      const errorCode = this._parseSolanaErrorCode(error) || -1
      return {
        res: null,
        error,
        errorCode
      }
    }
  }

  _parseSolanaErrorCode (errorMessage) {
    const matcher = /(?<=custom program error: 0x)(.*)$/
    const res = errorMessage.match(matcher)
    if (!res || !res.length) return null
    return parseInt(res[0], 16)
  }
}

module.exports = { TransactionHandler }
