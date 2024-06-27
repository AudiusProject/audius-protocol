import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction
} from '@solana/web3.js'
import { serialize } from 'borsh'
import bs58 from 'bs58'

import { SolanaUtils } from './SolanaUtils'
import type { TransactionHandler } from './transactionHandler'

class CreateTokenAccountInstructionData {
  hashed_eth_pk: Uint8Array

  constructor({ ethAddress }: { ethAddress: Uint8Array }) {
    this.hashed_eth_pk = ethAddress
  }
}

const createTokenAccountInstructionSchema = new Map([
  [
    CreateTokenAccountInstructionData,
    {
      kind: 'struct',
      fields: [['hashed_eth_pk', [20]]]
    }
  ]
])

/**
 * Gets the back account address for a user given their ethAddress
 */
export const getBankAccountAddress = async (
  ethAddress: string,
  claimableTokenPDA: PublicKey,
  solanaTokenProgramKey: PublicKey
) => {
  const ethAddressArr = SolanaUtils.ethAddressToArray(ethAddress)

  // We b58 encode our eth address to use as seed later on
  const b58EthAddress = bs58.encode(ethAddressArr)

  const accountToGenerate = await PublicKey.createWithSeed(
    /* from pubkey / base */ claimableTokenPDA,
    /* seed */ b58EthAddress,
    /* programId / owner */ solanaTokenProgramKey
  )
  return accountToGenerate
}

type CreateUserBankFromConfig = {
  ethAddress: string
  claimableTokenPDAKey: PublicKey
  feePayerKey: PublicKey
  mintKey: PublicKey
  solanaTokenProgramKey: PublicKey
  claimableTokenProgramKey: PublicKey
  transactionHandler: TransactionHandler
  recentBlockhash?: string
}

/**
 * createUserBank deterministically creates a Solana wAudio token account
 * from a provided ethAddress
 */
export const createUserBankFrom = async ({
  ethAddress,
  claimableTokenPDAKey,
  feePayerKey,
  mintKey,
  solanaTokenProgramKey,
  claimableTokenProgramKey,
  transactionHandler,
  recentBlockhash
}: CreateUserBankFromConfig) => {
  // Create instruction data
  const ethAddressArr = SolanaUtils.ethAddressToArray(ethAddress)

  const instructionData = new CreateTokenAccountInstructionData({
    ethAddress: ethAddressArr
  })
  const serializedInstructionData = serialize(
    createTokenAccountInstructionSchema,
    instructionData
  )

  // 0th index in the Rust instruction enum
  const serializedInstructionEnum = Uint8Array.of(
    0,
    ...serializedInstructionData
  )

  // Create the account we aim to generate
  const accountToGenerate = await getBankAccountAddress(
    ethAddress,
    claimableTokenPDAKey,
    solanaTokenProgramKey
  )

  const accounts = [
    // 0. `[sw]` Account to pay for creating token acc
    {
      pubkey: feePayerKey,
      isSigner: true,
      isWritable: true
    },
    // 1. `[r]` Mint account
    {
      pubkey: mintKey,
      isSigner: false,
      isWritable: false
    },
    // 2. `[r]` Base acc used in PDA token acc (need because of create_with_seed instruction)
    {
      pubkey: claimableTokenPDAKey,
      isSigner: false,
      isWritable: false
    },
    // 3. `[w]` PDA token account to create
    {
      pubkey: accountToGenerate,
      isSigner: false,
      isWritable: true
    },
    // `[r]` Rent id
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false
    },
    // 5. `[r]` SPL token account id
    {
      pubkey: solanaTokenProgramKey,
      isSigner: false,
      isWritable: false
    },
    // 6. `[r]` System program id
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false
    }
  ]

  const instructions = [
    new TransactionInstruction({
      keys: accounts,
      programId: claimableTokenProgramKey.toString() as unknown as PublicKey,
      data: Buffer.from(serializedInstructionEnum)
    }),
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: 100000
    })
  ]

  return await transactionHandler.handleTransaction({
    instructions,
    recentBlockhash,
    feePayerOverride: feePayerKey
  })
}
