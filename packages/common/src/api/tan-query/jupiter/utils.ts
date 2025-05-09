import { AudiusSdk } from '@audius/sdk'
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'

import { SwapErrorType, SwapStatus, UserBankManagedTokenInfo } from './types'

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

/**
 * Get the appropriate error response for a swap error based on the error stage.
 */
export function getSwapErrorResponse(params: {
  errorStage: string
  error: Error
  inputAmount?: {
    amount: number
    uiAmount: number
  }
  outputAmount?: {
    amount: number
    uiAmount: number
  }
}) {
  const { errorStage, error, inputAmount, outputAmount } = params

  if (errorStage === 'QUOTE_RETRIEVAL') {
    return {
      status: SwapStatus.ERROR,
      error: {
        type: SwapErrorType.QUOTE_FAILED,
        message: error?.message ?? 'Failed to get swap quote'
      }
    }
  } else if (errorStage === 'INPUT_TOKEN_PREPARATION') {
    return {
      status: SwapStatus.ERROR,
      error: {
        type: SwapErrorType.BUILD_FAILED,
        message: `Failed to prepare input token: ${error.message}`
      },
      inputAmount,
      outputAmount
    }
  } else if (errorStage === 'TRANSACTION_BUILD') {
    return {
      status: SwapStatus.ERROR,
      error: {
        type: SwapErrorType.BUILD_FAILED,
        message: error?.message ?? 'Failed to build transaction'
      },
      inputAmount,
      outputAmount
    }
  } else if (errorStage === 'TRANSACTION_RELAY') {
    return {
      status: SwapStatus.ERROR,
      error: {
        type: SwapErrorType.RELAY_FAILED,
        message: error?.message ?? 'Failed to relay transaction'
      },
      inputAmount,
      outputAmount
    }
  } else {
    return {
      status: SwapStatus.ERROR,
      error: {
        type: SwapErrorType.UNKNOWN,
        message: error?.message ?? 'An unknown error occurred'
      }
    }
  }
}
