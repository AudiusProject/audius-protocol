const SolanaUtils = require('./utils')
const {
  Transaction,
  sendAndConfirmTransaction,
} = require('@solana/web3.js')

// Should return
// { signature, error }
class TransactionHandler {
  constructor({ connection, useRelay, identityService = null, feePayerSecretKey = null, feePayerPublicKey = null }) {
    this.connection = connection
    this.useRelay = useRelay
    this.identityService = identityService
    this.feePayerSecretKey = feePayerSecretKey
    this.feePayerPublicKey = feePayerPublicKey
  }

  async handleTransaction(instructions, errorMapping = {}) {
    let result = null
    if (this.useRelay) {
      result = await this._relayTransaction(instructions, errorMapping)
    } else {
      result = await this._locallyConfirmTransaction(instructions, errorMapping)
    }
    console.log({result, errorMapping})
    if (result.error && errorMapping) {
      result.error = errorMapping.fromErrorCode(result.error)
    }
    return result
  }

  async _relayTransaction(instructions, errorMapping) {
    const relayable = instructions.map(SolanaUtils.prepareInstructionForRelay)
    const { blockhash: recentBlockhash } = await this.connection.getRecentBlockhash()

    const transactionData = {
      recentBlockhash,
      instructions: relayable
    }

    try {
      const response = await this.identityService.solanaRelay(transactionData)
      return { res: response, error: null }
    } catch (e) {
      const error = e.response.data.errorCode
      return { res: null, error }
    }
  }

  async _locallyConfirmTransaction(instructions, errorMapping) {
    if (!(this.feePayerPublicKey && this.feePayerPublicKey)) {
      console.error('Local feepayer keys missing for direct confirmation!')
      return {
        res: null,
        error: 'Missing keys'
      }
    }
    const tx = new Transaction({ recentBlockhash })

    instructions.forEach(i => tx.add(i))

    const signer = {
      publicKey: this.feePayerPublicKey,
      secretKey: this.feePayerSecretKey,
    }

    tx.sign(signer)

    try {
      const transactionSignature = await sendAndConfirmTransaction(
        connection,
        tx,
        [signer],
        {
          skipPreflight: false,
          commitment: 'processed',
          preflightCommitment: 'processed'
        }
      )
      return transactionSignature
    } catch (e) {
      const { message: errorMessage, logs: errorLogs } = e
      const error = this._parseSolanaErrorCode(errorMessage)
      return {
        res: null,
        error
      }
    }

  }

  _parseSolanaErrorCode(errorMessage) {
    const matcher = /(?<=custom program error: 0x)(.*)$/
    const res = errorMessage.match(matcher)
    if (!res || !res.length) return null
    return parseInt(res[0])
  }
}

module.exports = { TransactionHandler }