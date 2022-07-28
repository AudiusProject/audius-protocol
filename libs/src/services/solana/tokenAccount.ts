import { ASSOCIATED_TOKEN_PROGRAM_ID, Token } from '@solana/spl-token'
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair,
  Connection
} from '@solana/web3.js'
import type { IdentityService } from '../identity'

type FindAssociatedTokenAddressConfig = {
  solanaWalletKey: PublicKey
  mintKey: PublicKey
  solanaTokenProgramKey: PublicKey
}

/**
 * Finds the associated token address given a solana wallet public key
 */
export async function findAssociatedTokenAddress({
  solanaWalletKey,
  mintKey,
  solanaTokenProgramKey
}: FindAssociatedTokenAddressConfig) {
  const addresses = await PublicKey.findProgramAddress(
    [
      solanaWalletKey.toBuffer(),
      solanaTokenProgramKey.toBuffer(),
      mintKey.toBuffer()
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  return addresses[0]
}

type GetAssociatedTokenAccountInfoConfig = {
  tokenAccountAddressKey: PublicKey
  mintKey: PublicKey
  solanaTokenProgramKey: PublicKey
  connection: Connection
}

/**
 * Gets token account information (e.g. balance, ownership, etc.)
 */
export async function getAssociatedTokenAccountInfo({
  tokenAccountAddressKey,
  mintKey,
  solanaTokenProgramKey,
  connection
}: GetAssociatedTokenAccountInfoConfig) {
  const token = new Token(
    connection,
    mintKey,
    solanaTokenProgramKey,
    Keypair.generate()
  )
  const info = await token.getAccountInfo(tokenAccountAddressKey)
  return info
}

type CreateAssociatedTokenAccountParams = {
  feePayerKey: PublicKey
  solanaWalletKey: PublicKey
  mintKey: PublicKey
  solanaTokenProgramKey: PublicKey
  connection: Connection
  identityService: IdentityService
}

/**
 * Creates an associated token account for a given solana account (a wallet)
 */
export async function createAssociatedTokenAccount({
  feePayerKey,
  solanaWalletKey,
  mintKey,
  solanaTokenProgramKey,
  connection,
  identityService
}: CreateAssociatedTokenAccountParams) {
  const associatedTokenAddress = await findAssociatedTokenAddress({
    solanaWalletKey,
    mintKey,
    solanaTokenProgramKey
  })

  const accounts = [
    // 0. `[sw]` Funding account (must be a system account)
    {
      pubkey: feePayerKey,
      isSigner: true,
      isWritable: true
    },
    // 1. `[w]` Associated token account address to be created
    {
      pubkey: associatedTokenAddress,
      isSigner: false,
      isWritable: true
    },
    // 2. `[r]` Wallet address for the new associated token account
    {
      pubkey: solanaWalletKey,
      isSigner: false,
      isWritable: false
    },
    // 3. `[r]` The token mint for the new associated token account
    {
      pubkey: mintKey,
      isSigner: false,
      isWritable: false
    },
    // 4. `[r]` System program
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false
    },
    // 5. `[r]` SPL Token program
    {
      pubkey: solanaTokenProgramKey,
      isSigner: false,
      isWritable: false
    },
    // 6. `[r]` Rent sysvar
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false
    }
  ]

  const { blockhash } = await connection.getLatestBlockhash()

  const transactionData = {
    recentBlockhash: blockhash,
    instructions: [
      {
        keys: accounts.map((account) => {
          return {
            pubkey: account.pubkey.toString() as unknown as PublicKey,
            isSigner: account.isSigner,
            isWritable: account.isWritable
          }
        }),
        programId:
          ASSOCIATED_TOKEN_PROGRAM_ID.toString() as unknown as PublicKey,
        data: Buffer.from([])
      }
    ]
  }

  const response = await identityService.solanaRelay(transactionData)
  return response
}
