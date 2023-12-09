import type { AccountMeta, PublicKey } from '@solana/web3.js'

import type { ClaimableTokensInstruction } from './constants'

export type CreateClaimableTokensAccountParams = {
  /** The user's Ethereum wallet address. */
  ethAddress: string
  /** The account used to pay for the user bank creation. */
  payer: PublicKey
  /** The token mint of user bank. */
  mint: PublicKey
  /** The PDA owner of all user banks for the given mint and program ID. */
  authority: PublicKey
  /** The user bank account to create. */
  userBank: PublicKey
  /** The programId of the Claimable Tokens Program. */
  programId?: PublicKey
  /** The programId of the SPL Token Program. */
  tokenProgramId?: PublicKey
}

export type CreateClaimableTokensAccountInstructionData = {
  /** The instruction identifier. */
  instruction: ClaimableTokensInstruction.Create
  /** The user's Ethereum wallet address. */
  ethAddress: string
}

export type DecodedCreateClaimableTokensAccountInstruction = {
  programId: PublicKey
  keys: {
    payer: AccountMeta
    mint: AccountMeta
    authority: AccountMeta
    userBank: AccountMeta
    rent: AccountMeta
    tokenProgramId: AccountMeta
    systemProgramId: AccountMeta
  }
  data: CreateClaimableTokensAccountInstructionData
}

export type TransferClaimableTokensParams = {
  /** The account used to pay for the user bank creation. */
  payer: PublicKey
  /** The sending user's Ethereum wallet address. */
  sourceEthAddress: string
  /** The sending user's user bank account. */
  sourceUserBank: PublicKey
  /** The destination token account. */
  destination: PublicKey
  /** The nonce account, used to prevent double spends. */
  nonceAccount: PublicKey
  /** The PDA owner of all user banks for the given mint and program ID */
  authority: PublicKey
  /** The programId of the Claimable Tokens Program. */
  programId?: PublicKey
  /** The programId of the SPL Token Program. */
  tokenProgramId?: PublicKey
}
export type TransferClaimableTokensUnsignedInstructionData = {
  /** The instruction identifier */
  instruction: ClaimableTokensInstruction.Transfer
  sender: string
}
export type TransferClaimableTokensSignedInstructionData = {
  /** The destination token account. */
  destination: PublicKey
  /** The amount to send, in "wei"/"lamports" */
  amount: bigint
  /** The current value of the nonce account. */
  nonce: bigint
}

export type DecodedTransferClaimableTokensInstruction = {
  programId: PublicKey
  keys: {
    payer: AccountMeta
    sourceUserBank: AccountMeta
    destination: AccountMeta
    nonceAccount: AccountMeta
    authority: AccountMeta
    rent: AccountMeta
    sysvarInstructions: AccountMeta
    systemProgramId: AccountMeta
    tokenProgramId: AccountMeta
  }
  data: TransferClaimableTokensUnsignedInstructionData
}

export type DecodedClaimableTokenInstruction =
  | DecodedCreateClaimableTokensAccountInstruction
  | DecodedTransferClaimableTokensInstruction

export type NonceAccountData = {
  /** The current version of the program. */
  version: number
  /** The current nonce value. */
  nonce: bigint
}
