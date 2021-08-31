
const keccak256 = require('keccak256')
const secp256k1 = require('secp256k1')

class SolanaUtils {

  /**
   *
   *
   * @param {*} bytes
   * @param {string} ethPrivateKey
   */
  static signBytes(bytes, ethPrivateKey) {
    const msgHash = keccak256(bytes)
    const ethPrivateKeyArr = Buffer.from(ethPrivateKey, 'hex')
    const signatureObj = secp256k1.ecdsaSign(
      Uint8Array.from(msgHash),
      ethPrivateKeyArr
    )
    const signature = Buffer.from(signatureObj.signature)
    return {
      signature,
      recoveryId: signatureObj.recid
    }
  }

  /**
   * Puts an instruction in a serializable form that our relay can understand.
   *
   * @param {TransactionInstruction} instruction
   */
  static prepareInstructionForRelay(instruction) {
    return {
      programId: instruction.programId.toString(),
      data: instruction.data,
      keys: instruction.keys.map(({ isSigner, pubkey, isWritable }) => ({
        pubkey: pubkey.toString(),
        isSigner,
        isWritable
      }))
    }
  }

  /**
   * Constructs an attestation from inputs.
   *
   * @param {boolean} isOracle
   * @param {string} recipientEthAddress
   * @param {BN} tokenAmount
   * @param {string} transferId
   * @param {string} oracleAddress
   * @returns {Uint8Array}
   */
  static constructAttestation(
    isOracle,
    recipientEthAddress,
    tokenAmount,
    transferId,
    oracleAddress
  ) {
    const userBytes = ethAddressToArray(recipientEthAddress)
    const oracleBytes = ethAddressToArray(oracleAddress)
    const transferIdBytes = encoder.encode(transferId)
    const amountBytes = padBNToUint8Array(tokenAmount)
    const items = isOracle
      ? [userBytes, amountBytes, transferIdBytes]
      : [userBytes, amountBytes, transferIdBytes, oracleBytes]
    const sep = encoder.encode('_')
    const res = items.slice(1).reduce((prev, cur, i) => {
      return Uint8Array.of(...prev, ...sep, ...cur)
    }, Uint8Array.from(items[0]))
    return res
  }

  /**
   * Converts "UI" wAudio (i.e. 5) into properly denominated BN representation - (i.e. 5 * 10 ^ 9)
   *
   * @param {number} amount
   * @returns BN
   * @memberof SolanaWeb3Manager
   */
  static uiAudioToBNWaudio (amount) {
    return new BN(amount * 10 ** 9)
  }
}


module.exports = SolanaUtils
