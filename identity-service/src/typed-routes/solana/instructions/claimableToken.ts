import { AccountMeta, PublicKey, TransactionInstruction } from '@solana/web3.js'
import { decodeEthereumWallet } from './utils'

enum ClaimableTokenInstruction {
  Create = 0,
  Transfer = 1
}

type DecodedCreateClaimableTokenAccountInstruction = {
  programId: PublicKey
  keys: {
    payer: AccountMeta
    mint: AccountMeta
    authority: AccountMeta
    userbank: AccountMeta
    rent: AccountMeta
    tokenProgramId: AccountMeta
    systemProgramId: AccountMeta
  }
  data: { instruction: ClaimableTokenInstruction; ethereumAddress: string }
}

type DecodedTransferClaimableTokenInstruction = {
  programId: PublicKey
  keys: {
    payer: AccountMeta
    sourceUserbank: AccountMeta
    destination: AccountMeta
    nonce: AccountMeta
    authority: AccountMeta
    rent: AccountMeta
    sysvarInstructions: AccountMeta
    systemProgramId: AccountMeta
    tokenProgramId: AccountMeta
  }
  data: { instruction: ClaimableTokenInstruction; ethereumAddress: string }
}

type DecodedClaimableTokenInstruction =
  | DecodedCreateClaimableTokenAccountInstruction
  | DecodedTransferClaimableTokenInstruction

const decodeCreateClaimableTokenAccountInstruction = ({
  programId,
  keys: [
    payer,
    mint,
    authority,
    userbank,
    rent,
    tokenProgramId,
    systemProgramId
  ],
  data
}: TransactionInstruction): DecodedCreateClaimableTokenAccountInstruction => ({
  programId,
  keys: {
    payer,
    mint,
    authority,
    userbank,
    rent,
    tokenProgramId,
    systemProgramId
  },
  data: {
    instruction: ClaimableTokenInstruction.Create,
    ethereumAddress: decodeEthereumWallet(data)
  }
})

const decodeTransferClaimableTokenInstruction = ({
  programId,
  keys: [
    payer,
    sourceUserbank,
    destination,
    nonce,
    authority,
    rent,
    sysvarInstructions,
    systemProgramId,
    tokenProgramId
  ],
  data
}: TransactionInstruction): DecodedTransferClaimableTokenInstruction => ({
  programId,
  keys: {
    payer,
    sourceUserbank,
    destination,
    nonce,
    authority,
    rent,
    sysvarInstructions,
    systemProgramId,
    tokenProgramId
  },
  data: {
    instruction: ClaimableTokenInstruction.Transfer,
    ethereumAddress: decodeEthereumWallet(data)
  }
})

export const decodeClaimableTokenInstruction = (
  instruction: TransactionInstruction
) => {
  switch (instruction.data[0]) {
    case ClaimableTokenInstruction.Create:
      return decodeCreateClaimableTokenAccountInstruction(instruction)
    case ClaimableTokenInstruction.Transfer:
      return decodeTransferClaimableTokenInstruction(instruction)
    default:
      throw new Error('Invalid Claimable Token Program Instruction')
  }
}

export const isCreateClaimableTokenAccountInstruction = (
  decoded: DecodedClaimableTokenInstruction
): decoded is DecodedCreateClaimableTokenAccountInstruction =>
  decoded.data.instruction === ClaimableTokenInstruction.Create

export const isTransferClaimableTokenInstruction = (
  decoded: DecodedClaimableTokenInstruction
): decoded is DecodedTransferClaimableTokenInstruction =>
  decoded.data.instruction === ClaimableTokenInstruction.Transfer
