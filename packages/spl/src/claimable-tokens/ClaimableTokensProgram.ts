import { struct, u8 } from '@solana/buffer-layout'
import { publicKey, u64 } from '@solana/buffer-layout-utils'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  TransactionInstruction
} from '@solana/web3.js'
import bs58 from 'bs58'

import { ethAddress } from '../layout-utils'

import {
  CreateClaimableTokensAccountParams,
  CreateClaimableTokensAccountInstructionData,
  DecodedCreateClaimableTokensAccountInstruction,
  TransferClaimableTokensUnsignedInstructionData,
  TransferClaimableTokensParams,
  DecodedTransferClaimableTokensInstruction,
  NonceAccountData,
  TransferClaimableTokensSignedInstructionData,
  DecodedClaimableTokenInstruction
} from './types'

const TRANSFER_NONCE_PREFIX = 'N_'
const TRANSFER_NONCE_PREFIX_BYTES = new TextEncoder().encode(
  TRANSFER_NONCE_PREFIX
)
enum ClaimableTokensInstruction {
  Create = 0,
  Transfer = 1
}
/** @see {@link https://github.com/solana-labs/solana-web3.js/blob/974193946d5e6fade11b96d141f21ebe8f3ff5e2/packages/library-legacy/src/programs/secp256k1.ts#L47C11-L47C11 SECP256K1_INSTRUCTION_LAYOUT} */
const SECP256K1_INSTRUCTION_MESSAGE_DATA_START = 97

/**
 * The Claimable Tokens Program is responsible for the creation and control of
 * "user banks", which are accounts that are owned by the program itself but
 * controlled by users' Ethereum wallet addresses.
 *
 * Unlike normal Associated Token Accounts, the user bank accounts are owned
 * by the program, not a user's wallet. The only way for a user to transfer
 * tokens out of their user bank is by using this program method paired with
 * a signed Secp256k1 instruction from their Ethereum wallet specifying the
 * destination and amount.
 *
 * A user can have multiple user banks, one for each token mint.
 */
export class ClaimableTokensProgram {
  static programId = new PublicKey(
    'Ewkv3JahEFRKkcJmpoKB7pXbnUHwjAyXiwEo4ZY2rezQ'
  )

  static layouts = {
    createAccountInstructionData:
      struct<CreateClaimableTokensAccountInstructionData>([
        u8('instruction'),
        ethAddress('ethAddress')
      ]),
    unsignedTransferInstructionData:
      struct<TransferClaimableTokensUnsignedInstructionData>([
        u8('instruction'),
        ethAddress('sender')
      ]),
    signedTransferInstructionData:
      struct<TransferClaimableTokensSignedInstructionData>([
        publicKey('destination'),
        u64('amount'),
        u64('nonce')
      ]),
    nonceAccountData: struct<NonceAccountData>([u8('version'), u64('nonce')])
  }

  static createAccountInstruction({
    ethAddress,
    payer,
    mint,
    authority,
    userBank,
    programId = ClaimableTokensProgram.programId,
    tokenProgramId = TOKEN_PROGRAM_ID
  }: CreateClaimableTokensAccountParams) {
    const data = Buffer.alloc(
      ClaimableTokensProgram.layouts.createAccountInstructionData.span
    )
    ClaimableTokensProgram.layouts.createAccountInstructionData.encode(
      { instruction: ClaimableTokensInstruction.Create, ethAddress },
      data
    )
    const keys = [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: authority, isSigner: false, isWritable: false },
      { pubkey: userBank, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: tokenProgramId, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    ]
    return new TransactionInstruction({ keys, programId, data })
  }

  static decodeCreateAccountInstruction({
    programId,
    keys: [
      payer,
      mint,
      authority,
      userBank,
      rent,
      tokenProgramId,
      systemProgramId
    ],
    data
  }: TransactionInstruction): DecodedCreateClaimableTokensAccountInstruction {
    return {
      programId,
      keys: {
        payer,
        mint,
        authority,
        userBank,
        rent,
        tokenProgramId,
        systemProgramId
      },
      data: ClaimableTokensProgram.layouts.createAccountInstructionData.decode(
        data
      )
    }
  }

  static createTransferInstruction({
    payer,
    sourceEthAddress,
    sourceUserBank,
    destination,
    nonceAccount,
    authority,
    programId = ClaimableTokensProgram.programId,
    tokenProgramId = TOKEN_PROGRAM_ID
  }: TransferClaimableTokensParams) {
    const data = Buffer.alloc(
      ClaimableTokensProgram.layouts.unsignedTransferInstructionData.span
    )
    ClaimableTokensProgram.layouts.unsignedTransferInstructionData.encode(
      {
        instruction: ClaimableTokensInstruction.Transfer,
        sender: sourceEthAddress
      },
      data
    )
    const keys = [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: sourceUserBank, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: nonceAccount, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      {
        pubkey: SYSVAR_INSTRUCTIONS_PUBKEY,
        isSigner: false,
        isWritable: false
      },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: tokenProgramId, isSigner: false, isWritable: false }
    ]
    return new TransactionInstruction({ programId, keys, data })
  }

  static decodeTransferInstruction({
    programId,
    keys: [
      payer,
      sourceUserBank,
      destination,
      nonceAccount,
      authority,
      rent,
      sysvarInstructions,
      systemProgramId,
      tokenProgramId
    ],
    data
  }: TransactionInstruction): DecodedTransferClaimableTokensInstruction {
    return {
      programId,
      keys: {
        payer,
        sourceUserBank,
        destination,
        nonceAccount,
        authority,
        rent,
        sysvarInstructions,
        systemProgramId,
        tokenProgramId
      },
      data: ClaimableTokensProgram.layouts.unsignedTransferInstructionData.decode(
        data
      )
    }
  }

  static decodeInstruction(
    instruction: TransactionInstruction
  ): DecodedClaimableTokenInstruction {
    switch (instruction.data[0]) {
      case ClaimableTokensInstruction.Create:
        return ClaimableTokensProgram.decodeCreateAccountInstruction(
          instruction
        )
      case ClaimableTokensInstruction.Transfer:
        return ClaimableTokensProgram.decodeTransferInstruction(instruction)
      default:
        throw new Error('Invalid Claimable Token Program Instruction')
    }
  }

  static isCreateAccountInstruction(
    decoded: DecodedClaimableTokenInstruction
  ): decoded is DecodedCreateClaimableTokensAccountInstruction {
    return decoded.data.instruction === ClaimableTokensInstruction.Create
  }

  static isTransferInstruction(
    decoded: DecodedClaimableTokenInstruction
  ): decoded is DecodedTransferClaimableTokensInstruction {
    return decoded.data.instruction === ClaimableTokensInstruction.Transfer
  }

  static createSignedTransferInstructionData({
    destination,
    amount,
    nonce
  }: TransferClaimableTokensSignedInstructionData) {
    const data = Buffer.alloc(
      ClaimableTokensProgram.layouts.signedTransferInstructionData.span
    )
    ClaimableTokensProgram.layouts.signedTransferInstructionData.encode(
      {
        destination,
        amount,
        nonce
      },
      data
    )
    return data
  }

  static decodeSignedTransferInstructionData(
    instruction: TransactionInstruction
  ) {
    return ClaimableTokensProgram.layouts.signedTransferInstructionData.decode(
      Uint8Array.from(instruction.data).slice(
        SECP256K1_INSTRUCTION_MESSAGE_DATA_START
      )
    )
  }

  static deriveNonce({
    ethAddress: wallet,
    programId,
    authority
  }: {
    ethAddress: string
    programId: PublicKey
    authority: PublicKey
  }) {
    const ethAdddressData = ethAddress()
    const buffer = Buffer.alloc(ethAdddressData.span)
    ethAdddressData.encode(wallet, buffer)
    const seed = Uint8Array.from([...TRANSFER_NONCE_PREFIX_BYTES, ...buffer])
    return PublicKey.findProgramAddressSync(
      [authority.toBytes().slice(0, 32), seed],
      programId
    )[0]
  }

  static async deriveUserBank({
    ethAddress: wallet,
    claimableTokensPDA,
    tokenProgramId = TOKEN_PROGRAM_ID
  }: {
    ethAddress: string
    claimableTokensPDA: PublicKey
    tokenProgramId?: PublicKey
  }) {
    const ethAddressData = ethAddress()
    const buffer = Buffer.alloc(ethAddressData.span)
    ethAddressData.encode(wallet, buffer)
    const seed = bs58.encode(buffer)
    return await PublicKey.createWithSeed(
      claimableTokensPDA,
      seed,
      tokenProgramId
    )
  }

  static deriveAuthority = ({
    programId,
    mint
  }: {
    programId: PublicKey
    mint: PublicKey
  }) => {
    return PublicKey.findProgramAddressSync(
      [mint.toBytes().slice(0, 32)],
      programId
    )[0]
  }
}
