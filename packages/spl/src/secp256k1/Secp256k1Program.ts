import { keccak_256 } from '@noble/hashes/sha3'
import * as secp from '@noble/secp256k1'
import { struct, u8, u16, blob } from '@solana/buffer-layout'
import {
  Secp256k1Program as BaseSecp256k1Program,
  TransactionInstruction
} from '@solana/web3.js'

/**
 * The layout of Secp256k1 instruction data. Copied from @solana/web3.js because
 * it isn't exported there.
 *
 * @see {@link https://github.com/solana-labs/solana-web3.js/blob/d0d4d3e4d96f4fc7a4a9adf24e189be60183f460/packages/library-legacy/src/programs/secp256k1.ts#L47 SECP256K1_INSTRUCTION_LAYOUT}
 */
const SECP256K1_INSTRUCTION_LAYOUT = struct<
  Readonly<{
    ethAddress: Uint8Array
    ethAddressInstructionIndex: number
    ethAddressOffset: number
    messageDataOffset: number
    messageDataSize: number
    messageInstructionIndex: number
    numSignatures: number
    recoveryId: number
    signature: Uint8Array
    signatureInstructionIndex: number
    signatureOffset: number
  }>
>([
  u8('numSignatures'),
  u16('signatureOffset'),
  u8('signatureInstructionIndex'),
  u16('ethAddressOffset'),
  u8('ethAddressInstructionIndex'),
  u16('messageDataOffset'),
  u16('messageDataSize'),
  u8('messageInstructionIndex'),
  blob(20, 'ethAddress'),
  blob(64, 'signature'),
  u8('recoveryId')
])

type DecodedSecp256k1Instruction = ReturnType<typeof Secp256k1Program.decode>

/**
 * Extends the @solana/web3.js Secp256k1Program API with a decode method
 * and other useful utilities.
 */
export class Secp256k1Program extends BaseSecp256k1Program {
  /**
   * Decodes an Secp256k1 instruction data into a Typescript object.
   * Useful for debugging.
   */
  static decode(instructionOrData: TransactionInstruction | Uint8Array) {
    const data =
      'data' in instructionOrData ? instructionOrData.data : instructionOrData
    const decoded = SECP256K1_INSTRUCTION_LAYOUT.decode(data)
    const message = data.subarray(
      decoded.messageDataOffset,
      decoded.messageDataOffset + decoded.messageDataSize
    )
    return {
      ...decoded,
      message
    }
  }

  /**
   * Creates an Ethereum address from a secp256k1 public key.
   *
   * Port of the secp256k1 program's Rust code.
   * @see {@link https://github.com/solana-labs/solana/blob/27eff8408b7223bb3c4ab70523f8a8dca3ca6645/sdk/src/secp256k1_instruction.rs#L906C1-L914C2 construct_eth_pubkey}
   */
  static constructEthPubkey(pubkey: Uint8Array) {
    return keccak_256(Buffer.from(pubkey.subarray(1))).subarray(12)
  }

  /**
   * Recovers the true signer for a decoded instruction.
   */
  static recoverSigner(decoded: DecodedSecp256k1Instruction) {
    const messageHash = keccak_256(decoded.message)
    return secp.recoverPublicKey(
      messageHash,
      decoded.signature,
      decoded.recoveryId
    )
  }

  /**
   * Verifies the true signer for a decoded instruction matches the one
   * in the instruction data.
   */
  static verifySignature(decoded: DecodedSecp256k1Instruction) {
    const signer = Secp256k1Program.recoverSigner(decoded)
    const address = Secp256k1Program.constructEthPubkey(signer)
    for (let i = 0; i < address.length; i++) {
      if (address.at(i) !== decoded.ethAddress.at(i)) {
        return false
      }
    }
    return address.byteLength === decoded.ethAddress.byteLength
  }
}
