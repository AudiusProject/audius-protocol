import { SwapRequest } from '@jup-ag/api'
import { createCloseAccountInstruction } from '@solana/spl-token'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'

import {
  convertJupiterInstructions,
  getJupiterQuoteByMintWithRetry
} from '~/services/Jupiter'
import { TokenInfo } from '~/store/ui/buy-sell/types'

import {
  SwapDependencies,
  SwapTokensParams,
  SwapTokensResult,
  SwapStatus,
  SwapErrorType
} from './types'
import {
  addTransferFromUserBankInstructions,
  buildAndSendTransaction,
  executeWithRetry,
  getJupiterSwapInstructions,
  invalidateSwapQueries,
  JUPITER_MAX_RETRIES,
  prepareOutputUserBank,
  validateAndCreateTokenConfigs
} from './utils'

export const executeDirectSwap = async (
  params: SwapTokensParams,
  dependencies: SwapDependencies,
  tokens: Record<string, TokenInfo>
): Promise<SwapTokensResult> => {
  let retryCount = 0

  try {
    const result = await executeWithRetry(
      async () => {
        // Invalidate balances before retry (except on first attempt)
        if (retryCount > 0) {
          await invalidateSwapQueries(
            dependencies.queryClient,
            dependencies.user
          )
        }
        retryCount++
        return await performDirectSwap(params, dependencies, tokens, retryCount)
      },
      JUPITER_MAX_RETRIES,
      2000
    )

    return {
      ...result,
      retryCount,
      maxRetries: JUPITER_MAX_RETRIES
    }
  } catch (error: unknown) {
    return {
      status: SwapStatus.ERROR,
      errorStage: 'DIRECT_SWAP_RETRY_EXHAUSTED',
      error: {
        type: SwapErrorType.UNKNOWN,
        message: `Direct swap failed after ${JUPITER_MAX_RETRIES} retries: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      inputAmount: undefined,
      outputAmount: undefined,
      retryCount,
      maxRetries: JUPITER_MAX_RETRIES,
      isRetrying: false
    }
  }
}

const performDirectSwap = async (
  params: SwapTokensParams,
  dependencies: SwapDependencies,
  tokens: Record<string, TokenInfo>,
  currentRetryCount: number
): Promise<SwapTokensResult> => {
  let errorStage = 'DIRECT_SWAP_UNKNOWN'

  const {
    inputMint: inputMintUiAddress,
    outputMint: outputMintUiAddress,
    amountUi
  } = params
  const wrapUnwrapSol = params.wrapUnwrapSol ?? true

  const {
    sdk,
    keypair,
    userPublicKey,
    feePayer,
    ethAddress,
    queryClient,
    user
  } = dependencies

  const instructions: TransactionInstruction[] = []

  // Validate tokens and create configs
  errorStage = 'DIRECT_SWAP_TOKEN_VALIDATION'
  const tokenConfigsResult = validateAndCreateTokenConfigs(
    inputMintUiAddress,
    outputMintUiAddress,
    tokens
  )

  if ('error' in tokenConfigsResult) {
    return {
      ...tokenConfigsResult.error,
      errorStage
    }
  }

  const { inputTokenConfig, outputTokenConfig } = tokenConfigsResult

  // Get quote
  errorStage = 'DIRECT_SWAP_GET_QUOTE'
  const { quoteResult: quote } = await getJupiterQuoteByMintWithRetry({
    inputMint: inputMintUiAddress,
    outputMint: outputMintUiAddress,
    inputDecimals: inputTokenConfig.decimals,
    outputDecimals: outputTokenConfig.decimals,
    amountUi,
    swapMode: 'ExactIn',
    onlyDirectRoutes: false
  })

  // Prepare input token
  errorStage = 'DIRECT_SWAP_PREPARE_INPUT'
  const sourceAtaForJupiter = await addTransferFromUserBankInstructions({
    tokenInfo: inputTokenConfig,
    userPublicKey,
    ethAddress: ethAddress!,
    amountLamports: BigInt(quote.inputAmount.amount),
    sdk,
    feePayer,
    instructions
  })

  // Prepare output destination
  errorStage = 'DIRECT_SWAP_PREPARE_OUTPUT'
  const preferredJupiterDestination = await prepareOutputUserBank(
    sdk,
    ethAddress!,
    outputTokenConfig
  )

  // Get swap instructions
  errorStage = 'DIRECT_SWAP_GET_INSTRUCTIONS'
  const swapRequestParams: SwapRequest = {
    quoteResponse: quote.quote,
    userPublicKey: userPublicKey.toBase58(),
    destinationTokenAccount: preferredJupiterDestination,
    wrapAndUnwrapSol: wrapUnwrapSol,
    dynamicSlippage: true
  }

  const { swapInstructionsResult, outputAtaForJupiter } =
    await getJupiterSwapInstructions(
      swapRequestParams,
      outputTokenConfig,
      userPublicKey,
      feePayer,
      instructions
    )
  const { swapInstruction, addressLookupTableAddresses } =
    swapInstructionsResult

  const jupiterInstructions = convertJupiterInstructions([swapInstruction])

  instructions.push(...jupiterInstructions)

  // Cleanup
  errorStage = 'DIRECT_SWAP_CLEANUP'
  const atasToClose: PublicKey[] = []
  if (sourceAtaForJupiter) {
    atasToClose.push(sourceAtaForJupiter)
  }
  if (outputAtaForJupiter) {
    atasToClose.push(outputAtaForJupiter)
  }

  for (const ataToClose of atasToClose) {
    instructions.push(
      createCloseAccountInstruction(ataToClose, feePayer, userPublicKey)
    )
  }

  // Build and send transaction
  errorStage = 'DIRECT_SWAP_BUILD_TRANSACTION'
  const signature = await buildAndSendTransaction(
    sdk,
    keypair,
    feePayer,
    instructions,
    addressLookupTableAddresses
  )

  // Invalidate queries
  errorStage = 'DIRECT_SWAP_INVALIDATE_QUERIES'
  await invalidateSwapQueries(queryClient, user)

  return {
    status: SwapStatus.SUCCESS,
    signature,
    inputAmount: quote.inputAmount,
    outputAmount: quote.outputAmount,
    retryCount: currentRetryCount,
    maxRetries: JUPITER_MAX_RETRIES,
    isRetrying: false
  }
}
