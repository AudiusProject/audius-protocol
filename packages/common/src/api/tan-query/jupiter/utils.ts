import { AudiusSdk } from '@audius/sdk'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'

import { JUPITER_PROGRAM_ID } from './constants'
import { UserBankManagedTokenInfo } from './types'

export async function addUserBankToAtaInstructions({
  tokenInfo,
  userPublicKey,
  ethAddress,
  amountLamports,
  sdk,
  feePayer,
  instructions
}: {
  tokenInfo: UserBankManagedTokenInfo
  userPublicKey: PublicKey
  ethAddress: string
  amountLamports: bigint
  sdk: any
  feePayer: PublicKey
  instructions: TransactionInstruction[]
}): Promise<PublicKey> {
  const mint = new PublicKey(tokenInfo.mintAddress)
  const ata = getAssociatedTokenAddressSync(mint, userPublicKey, true)

  try {
    await getAccount(sdk.services.solanaClient.connection, ata)
  } catch (e) {
    instructions.push(
      createAssociatedTokenAccountIdempotentInstruction(
        feePayer,
        ata,
        userPublicKey,
        mint
      )
    )
  }

  const secpTransferInstruction =
    await sdk.services.claimableTokensClient.createTransferSecpInstruction({
      amount: amountLamports,
      ethWallet: ethAddress,
      mint: tokenInfo.claimableTokenMint,
      destination: ata,
      instructionIndex: instructions.length
    })
  const transferInstruction =
    await sdk.services.claimableTokensClient.createTransferInstruction({
      ethWallet: ethAddress,
      mint: tokenInfo.claimableTokenMint,
      destination: ata
    })

  instructions.push(secpTransferInstruction, transferInstruction)
  return ata
}

export async function addAtaToUserBankInstructions({
  tokenInfo,
  userPublicKey,
  ethAddress,
  amountLamports,
  sourceAta,
  sdk,
  feePayer,
  instructions
}: {
  tokenInfo: UserBankManagedTokenInfo
  userPublicKey: PublicKey
  ethAddress: string
  amountLamports: bigint
  sourceAta: PublicKey
  sdk: AudiusSdk
  feePayer: PublicKey
  instructions: TransactionInstruction[]
}): Promise<PublicKey> {
  const mint = new PublicKey(tokenInfo.mintAddress)
  const userBankAddress =
    await sdk.services.claimableTokensClient.deriveUserBank({
      ethWallet: ethAddress,
      mint: tokenInfo.claimableTokenMint
    })

  instructions.push(
    createTransferCheckedInstruction(
      sourceAta,
      mint,
      userBankAddress,
      userPublicKey,
      amountLamports,
      tokenInfo.decimals
    ),
    createCloseAccountInstruction(sourceAta, feePayer, userPublicKey)
  )
  return userBankAddress
}

export function updateJupiterAtaCreationFeePayer(
  jupiterInstructions: TransactionInstruction[],
  userPublicKey: PublicKey,
  relayFeePayer: PublicKey
): void {
  for (const ix of jupiterInstructions) {
    const isAssociatedTokenProgram = ix.programId.equals(
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
    const isPayerTheUser =
      ix.keys.length > 0 &&
      ix.keys[0].pubkey.equals(userPublicKey) &&
      ix.keys[0].isSigner &&
      ix.keys[0].isWritable

    if (isAssociatedTokenProgram && isPayerTheUser) {
      ix.keys[0].pubkey = relayFeePayer
      break
    }
  }
}

export function findActualJupiterDestination(
  jupiterInstructions: TransactionInstruction[]
): PublicKey | undefined {
  const jupiterSwapInstruction = jupiterInstructions.find((ix) =>
    ix.programId.equals(JUPITER_PROGRAM_ID)
  )
  if (jupiterSwapInstruction) {
    const destinationKeyIndex = 6
    if (jupiterSwapInstruction.keys.length > destinationKeyIndex) {
      return jupiterSwapInstruction.keys[destinationKeyIndex].pubkey
    }
  }
  return undefined
}

export function findJupiterTemporarySetupAta(
  jupiterInstructions: TransactionInstruction[],
  outputMintAddress: string,
  actualFinalJupiterDestination?: PublicKey
): PublicKey | undefined {
  const createAtaInstruction = jupiterInstructions.find((ix) => {
    const isAssociatedTokenProgram = ix.programId.equals(
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
    const isForOutputMint =
      ix.keys.length >= 4 &&
      ix.keys[3].pubkey.toBase58().toUpperCase() ===
        outputMintAddress.toUpperCase()
    const createdAtaAddress =
      ix.keys.length >= 2 ? ix.keys[1].pubkey : undefined

    const isNotTheFinalDestination =
      !actualFinalJupiterDestination ||
      (createdAtaAddress &&
        !createdAtaAddress.equals(actualFinalJupiterDestination))

    return (
      isAssociatedTokenProgram &&
      isForOutputMint &&
      isNotTheFinalDestination &&
      createdAtaAddress
    )
  })

  return createAtaInstruction ? createAtaInstruction.keys[1].pubkey : undefined
}
