import { USDC, UsdcWei } from '@audius/fixed-decimal'
import type { AudiusSdk } from '@audius/sdk'
import { SwapInstructionsResponse, SwapRequest } from '@jup-ag/api'
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import {
  PublicKey,
  TransactionInstruction,
  VersionedTransaction
} from '@solana/web3.js'
import type { Keypair } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'

import type { User } from '~/models/User'
import { jupiterInstance } from '~/services/Jupiter'
import { TokenInfo } from '~/store/ui/buy-sell/types'

import { QUERY_KEYS } from '../queryKeys'

import {
  ClaimableTokenMint,
  SwapErrorType,
  SwapStatus,
  SwapTokensResult,
  UserBankManagedTokenInfo
} from './types'

export async function addTransferFromUserBankInstructions({
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

export async function addTransferToUserBankInstructions({
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
 * Creates an Associated Token Account (ATA) for Jupiter when shared accounts are not supported.
 * This is used as a fallback when Jupiter's shared account system fails for simple AMMs.
 *
 * @param tokenConfig - The token configuration containing mint address
 * @param userPublicKey - The user's public key
 * @param feePayer - The fee payer's public key
 * @param instructions - Array to push the ATA creation instruction to
 * @returns The created ATA public key
 */
export function addJupiterOutputAtaInstruction({
  tokenConfig,
  userPublicKey,
  feePayer,
  instructions
}: {
  tokenConfig: UserBankManagedTokenInfo
  userPublicKey: PublicKey
  feePayer: PublicKey
  instructions: TransactionInstruction[]
}): PublicKey {
  const outputAtaForJupiter = getAssociatedTokenAddressSync(
    new PublicKey(tokenConfig.mintAddress),
    userPublicKey,
    true
  )

  instructions.push(
    createAssociatedTokenAccountIdempotentInstruction(
      feePayer,
      outputAtaForJupiter,
      userPublicKey,
      new PublicKey(tokenConfig.mintAddress)
    )
  )

  return outputAtaForJupiter
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

/**
 * Formats a numeric value as USDC.
 * Uses floor(2) rounding to ensure consistent display across the application.
 *
 * @param value - The numeric value to format (can be number or string)
 * @param options - Formatting options
 * @returns Formatted USDC string
 */
export function formatUSDCValue(
  value?: number | string,
  options: {
    /** Whether to include the $ prefix (default: false) */
    includeDollarSign?: boolean
    /** Whether to use toFixed format instead of toLocaleString (default: true) */
    useFixed?: boolean
  } = {}
) {
  const { includeDollarSign = false, useFixed = true } = options

  // Handle null, undefined, or empty string cases
  if (!value && value !== 0) {
    return null
  }

  const numericValue =
    typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value

  if (isNaN(numericValue) || !isFinite(numericValue)) {
    return null
  }

  // Add early validation for extremely large numbers to prevent overflow
  // This corresponds to ~1 trillion USDC, which is well above any realistic amount
  const MAX_SAFE_USDC_VALUE = 1000000000000
  if (Math.abs(numericValue) > MAX_SAFE_USDC_VALUE) {
    console.warn('USDC value too large for safe formatting:', numericValue)
    return null
  }

  // Use the same rounding logic as CashWallet.tsx
  // Convert to wei (multiply by 1,000,000) and ensure it's an integer
  const weiValue = Math.floor(Math.abs(numericValue) * 1000000)

  // Ensure weiValue is valid for BigInt constructor
  if (weiValue < 0 || !Number.isInteger(weiValue)) {
    return null
  }

  // Additional safety check for BigInt constructor limits
  if (weiValue > Number.MAX_SAFE_INTEGER) {
    console.warn('Wei value exceeds MAX_SAFE_INTEGER:', weiValue)
    return null
  }

  try {
    const usdcValue = USDC(BigInt(weiValue) as UsdcWei).floor(2)

    if (useFixed) {
      const formatted = usdcValue.toFixed(2).replace('$', '')
      return includeDollarSign ? `$${formatted}` : formatted
    } else {
      return usdcValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }
  } catch (error) {
    console.warn('Error formatting USDC value:', {
      value,
      numericValue,
      weiValue,
      error
    })
    return null
  }
}

/**
 * Formats a token price string using USDC formatting with custom decimal places.
 * This function preserves the original behavior for token price display.
 *
 * @param price - The price string to format
 * @param decimalPlaces - Number of decimal places to show
 * @returns Formatted price string
 */
export function formatTokenPrice(price: string, decimalPlaces: number): string {
  // USDC constructor uses 6 decimal places, so we need to constrain the display
  // to not exceed what's available in the FixedDecimal representation
  const maxDecimalPlaces = Math.min(decimalPlaces, 6)

  return USDC(price.replace(/,/g, '')).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimalPlaces
  })
}

const SWAP_LOOKUP_TABLE_ADDRESS = new PublicKey(
  '2WB87JxGZieRd7hi3y87wq6HAsPLyb9zrSx8B5z1QEzM'
)

export const findTokenByAddress = (
  tokens: Record<string, TokenInfo>,
  address: string
): TokenInfo | undefined => {
  return Object.values(tokens).find(
    (token) => token.address.toLowerCase() === address.toLowerCase()
  )
}

export const getClaimableTokenMint = (token: TokenInfo): ClaimableTokenMint => {
  if (token.symbol === 'USDC') return 'USDC'
  return new PublicKey(token.address)
}

export const createTokenConfig = (
  token: TokenInfo
): UserBankManagedTokenInfo => ({
  mintAddress: token.address,
  claimableTokenMint: getClaimableTokenMint(token),
  decimals: token.decimals
})

export const validateAndCreateTokenConfigs = (
  inputMintAddress: string,
  outputMintAddress: string,
  tokens: Record<string, TokenInfo>
):
  | {
      inputTokenConfig: UserBankManagedTokenInfo
      outputTokenConfig: UserBankManagedTokenInfo
    }
  | { error: SwapTokensResult } => {
  // Find input and output tokens
  const inputToken = findTokenByAddress(tokens, inputMintAddress)
  const outputToken = findTokenByAddress(tokens, outputMintAddress)

  if (!inputToken || !outputToken) {
    return {
      error: {
        status: SwapStatus.ERROR,
        error: {
          type: SwapErrorType.BUILD_FAILED,
          message: 'Token not found in available tokens'
        }
      }
    }
  }

  // Create token configs
  const inputTokenConfig = createTokenConfig(inputToken)
  const outputTokenConfig = createTokenConfig(outputToken)

  return { inputTokenConfig, outputTokenConfig }
}

export const getJupiterSwapInstructions = async (
  swapRequestParams: SwapRequest,
  outputTokenConfig?: UserBankManagedTokenInfo,
  userPublicKey?: PublicKey,
  feePayer?: PublicKey,
  instructions?: TransactionInstruction[]
): Promise<{
  swapInstructionsResult: SwapInstructionsResponse
  outputAtaForJupiter?: PublicKey
}> => {
  let swapInstructionsResult
  let outputAtaForJupiter: PublicKey | undefined

  try {
    swapInstructionsResult = await jupiterInstance.swapInstructionsPost({
      swapRequest: {
        ...swapRequestParams,
        useSharedAccounts: true
      }
    })
  } catch (e) {
    swapInstructionsResult = await jupiterInstance.swapInstructionsPost({
      swapRequest: {
        ...swapRequestParams,
        useSharedAccounts: false
      }
    })

    // Add output ATA instruction if fallback is used and all required params are provided
    if (outputTokenConfig && userPublicKey && feePayer && instructions) {
      outputAtaForJupiter = addJupiterOutputAtaInstruction({
        tokenConfig: outputTokenConfig,
        userPublicKey,
        feePayer,
        instructions
      })
    }
  }

  return { swapInstructionsResult, outputAtaForJupiter }
}

export const buildAndSendTransaction = async (
  sdk: AudiusSdk,
  keypair: Keypair,
  feePayer: PublicKey,
  instructions: TransactionInstruction[],
  addressLookupTableAddresses: string[]
): Promise<string> => {
  // Build transaction
  const swapTx: VersionedTransaction =
    await sdk.services.solanaClient.buildTransaction({
      feePayer,
      instructions,
      addressLookupTables: addressLookupTableAddresses
        .map((addr: string) => new PublicKey(addr))
        .concat([SWAP_LOOKUP_TABLE_ADDRESS])
    })

  // Sign and send transaction
  swapTx.sign([keypair])
  const signature = await sdk.services.solanaClient.sendTransaction(swapTx)

  // Wait for transaction confirmation to ensure the state changes are available
  // for subsequent transactions in double swaps
  await sdk.services.solanaClient.connection.confirmTransaction(
    signature,
    'finalized'
  )

  return signature
}

export const invalidateSwapQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
  user: User
): Promise<void> => {
  // Invalidate user-specific queries
  if (user?.wallet) {
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.usdcBalance, user.wallet]
    })
  }

  // Invalidate general user coins query
  await queryClient.invalidateQueries({
    queryKey: [QUERY_KEYS.userCoins]
  })
}

export const prepareOutputUserBank = async (
  sdk: AudiusSdk,
  ethAddress: string,
  outputTokenConfig: UserBankManagedTokenInfo
): Promise<string> => {
  const result = await sdk.services.claimableTokensClient.getOrCreateUserBank({
    ethWallet: ethAddress,
    mint: outputTokenConfig.claimableTokenMint
  })
  return result.userBank.toBase58()
}
