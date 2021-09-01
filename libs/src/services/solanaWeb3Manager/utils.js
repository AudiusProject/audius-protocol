const { PublicKey } = require('@solana/web3.js')
const BN = require('bn.js')
const keccak256 = require('keccak256')
const secp256k1 = require('secp256k1')

class SolanaUtils {
  /**
   *
   *
   * @param {*} bytes
   * @param {string} ethPrivateKey
   */
  static signBytes (bytes, ethPrivateKey) {
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
  static prepareInstructionForRelay (instruction) {
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
   * Constructs a transfer ID
   * @param {string} challengeId
   * @param {string} specifier
   * @returns {string}
   */
  static constructTransferId (challengeId, specifier) {
    return `${challengeId}:${specifier}`
  }
  /**
   * Constructs an attestation from inputs.
   *
   * @param {string} recipientEthAddress
   * @param {BN} tokenAmount
   * @param {string} transferId
   * @param {string} [oracleAddress] optional oracle address, only used for DN attestations
   * @returns {Uint8Array}
   */
  static constructAttestation (
    recipientEthAddress,
    tokenAmount,
    transferId,
    oracleAddress
  ) {
    const encoder = new TextEncoder()
    const userBytes = SolanaUtils.ethAddressToArray(recipientEthAddress)
    const transferIdBytes = encoder.encode(transferId)
    const amountBytes = padBNToUint8Array(tokenAmount)
    const items = oracleAddress
      ? [userBytes, amountBytes, transferIdBytes, SolanaUtils.ethAddressToArray(oracleAddress)]
      : [userBytes, amountBytes, transferIdBytes]
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

  /**
   * Derives a program address from a program ID and pubkey as seed.
   * Optionally takes in seeds.
   * Returns the new pubkey and bump seeds.
   *
   * @param {PublicKey} programId
   * @param {PublicKey} pubkey
   * @param {Uint8Array} [seed] optionally include a seed
   * @returns {Promise<[PublicKey, number]>}
   */
  static async findProgramAddressFromPubkey (programId, pubkey, seed) {
    let seedsArr = [pubkey.toBytes().slice(0, 32)]
    if (seed) {
      seedsArr.push(seed)
    }
    return PublicKey.findProgramAddress(
      seedsArr,
      programId
    )
  }

  /**
   * Converts an eth address hex represenatation to an array of Uint8s in big endian notation
   * @param {string} ethAddress
   * @returns {Uint8Array}
   */
  static ethAddressToArray (ethAddress) {
    const strippedEthAddress = ethAddress.replace('0x', '')
    return Uint8Array.of(...new BN(strippedEthAddress, 'hex').toArray('be'))
  }
}

/**
 * Converts a BN to a Uint8Array of length 8, in little endian notation.
 * Useful for when Rust wants a u64 (8 * 8) represented as a byte array.
 * Ex: https://github.com/AudiusProject/audius-protocol/blob/master/solana-programs/reward-manager/program/src/processor.rs#L389
 *
 * @param {BN} bn
 */
const padBNToUint8Array = (bn) => bn.toArray('le', 8)

module.exports = SolanaUtils
