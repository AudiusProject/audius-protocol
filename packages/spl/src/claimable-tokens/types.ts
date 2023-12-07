import type { AccountMeta, PublicKey } from '@solana/web3.js'

import type { ClaimableTokensInstruction } from './constants'

/**
 * Create Account types
 */
export type CreateClaimableTokensAccountParams = {
  ethAddress: string
  payer: PublicKey
  mint: PublicKey
  authority: PublicKey
  userBank: PublicKey
  programId?: PublicKey
  tokenProgramId?: PublicKey
}
export type CreateClaimableTokensAccountInstructionData = {
  instruction: ClaimableTokensInstruction
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

/*
 * Transfer types
 */
export type TransferClaimableTokensParams = {
  payer: PublicKey
  sourceEthAddress: string
  sourceUserBank: PublicKey
  destination: PublicKey
  nonceAccount: PublicKey
  authority: PublicKey
  programId?: PublicKey
  tokenProgramId?: PublicKey
}
export type TransferClaimableTokensUnsignedInstructionData = {
  instruction: ClaimableTokensInstruction
  sender: string
}
export type TransferClaimableTokensSignedInstructionData = {
  destination: PublicKey
  amount: bigint
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

/* Nonce */
export type NonceAccountData = { version: number; nonce: bigint }
