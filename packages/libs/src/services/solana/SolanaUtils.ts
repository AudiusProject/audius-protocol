import {
  PublicKey,
  PublicKeyInitData,
  TransactionInstruction
} from '@solana/web3.js'
import BN from 'bn.js'
import keccak256 from 'keccak256'
import secp256k1 from 'secp256k1'

import { WAUDIO_DECIMALS } from '../../constants'

import { padBNToUint8Array } from './padBNToUint8Array'

export class SolanaUtils {
  /**
   * Signs arbitrary bytes
   */
  static signBytes(bytes: Buffer, ethPrivateKey: string) {
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
   * Note we are faking the return type for callers to work with it easier
   */
  static prepareInstructionForRelay(instruction: TransactionInstruction) {
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
   */
  static constructTransferId(challengeId: string, specifier: string) {
    return `${challengeId}:${specifier}`
  }

  /**
   * Constructs an attestation from inputs.
   */
  static constructAttestation(
    recipientEthAddress: string,
    tokenAmount: BN,
    transferId: string,
    oracleAddress?: string
  ) {
    const encoder = new TextEncoder()
    const userBytes = SolanaUtils.ethAddressToArray(recipientEthAddress)
    const transferIdBytes = encoder.encode(transferId)
    const amountBytes = padBNToUint8Array(tokenAmount)
    const items = oracleAddress
      ? ([
          userBytes,
          amountBytes,
          transferIdBytes,
          SolanaUtils.ethAddressToArray(oracleAddress)
        ] as const)
      : ([userBytes, amountBytes, transferIdBytes] as const)
    const sep = encoder.encode('_')
    const res = items.slice(1).reduce<Uint8Array>((prev, cur) => {
      return Uint8Array.of(...prev, ...sep, ...cur)
    }, Uint8Array.from(items[0]))
    return res
  }

  /**
   * Converts "UI" wAudio (i.e. 5) into properly denominated BN representation - (i.e. 5 * 10 ^ 8)
   */
  static uiAudioToBNWaudio(amount: number) {
    return new BN(amount * 10 ** WAUDIO_DECIMALS)
  }

  /**
   * Derives a program address from a program ID and pubkey as seed.
   * Optionally takes in seeds.
   * Returns the new pubkey and bump seeds.
   */
  static async findProgramAddressFromPubkey(
    programId: PublicKey,
    pubkey: PublicKey,
    seed?: Uint8Array
  ) {
    const seedsArr = [pubkey.toBytes().slice(0, 32)]
    if (seed) {
      seedsArr.push(seed)
    }
    return await PublicKey.findProgramAddress(seedsArr, programId)
  }

  /**
   * Finds a program address, using both seeds, pubkey, and the derived authority.
   * Return [authority, derivedAddress, and bumpSeeds]
   *
   */
  static async findProgramAddressWithAuthority(
    programId: PublicKey,
    address: PublicKey,
    seed: Uint8Array
  ) {
    // Finds the authority account by generating a PDA with the address as a seed
    const [authority] = await SolanaUtils.findProgramAddressFromPubkey(
      programId,
      address
    )

    const [derivedAddress, bumpSeed] =
      await SolanaUtils.findProgramAddressFromPubkey(programId, authority, seed)
    return [authority, derivedAddress, bumpSeed] as const
  }

  /**
   * Converts an eth address hex represenatation to an array of Uint8s in big endian notation
   * @param ethAddress
   */
  static ethAddressToArray(ethAddress: string) {
    const strippedEthAddress = ethAddress.replace('0x', '')
    // Need to pad the array to length 20 - otherwise, hex eth keys starting with '0' would
    // result in truncated arrays, while eth spec is always 20 bytes
    return Uint8Array.of(...new BN(strippedEthAddress, 'hex').toArray('be', 20))
  }

  // Safely create pubkey from nullable val
  static newPublicKeyNullable<T extends PublicKeyInitData | null>(
    val: T
  ): NullablePublicKey<T> {
    return val
      ? (new PublicKey(val) as NullablePublicKey<T>)
      : (null as NullablePublicKey<T>)
  }
}

type NullablePublicKey<T> = T extends null ? null : PublicKey
