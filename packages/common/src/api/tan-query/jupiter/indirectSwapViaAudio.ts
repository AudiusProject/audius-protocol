import { SwapRequest } from '@jup-ag/api'
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  getAccount,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'

import {
  convertJupiterInstructions,
  getJupiterQuoteByMintWithRetry,
  JupiterQuoteResult
} from '~/services/Jupiter'
import { TokenInfo } from '~/store/ui/buy-sell/types'
import { TOKEN_LISTING_MAP } from '~/store/ui/shared/tokenConstants'

import {
  SwapDependencies,
  SwapTokensParams,
  SwapTokensResult,
  SwapStatus,
  SwapErrorType,
  IndirectSwapContext
} from './types'
import {
  addTransferFromUserBankInstructions,
  addTransferToUserBankInstructions,
  buildAndSendTransaction,
  createTokenConfig,
  executeWithRetry,
  findTokenByAddress,
  getJupiterSwapInstructions,
  invalidateSwapQueries,
  JUPITER_MAX_RETRIES,
  prepareOutputUserBank,
  validateAndCreateTokenConfigs
} from './utils'

// AUDIO mint address for use as intermediary token
const AUDIO_MINT = TOKEN_LISTING_MAP.AUDIO.address
const AUDIO_DECIMALS = TOKEN_LISTING_MAP.AUDIO.decimals

export const executeIndirectSwap = async (
  params: SwapTokensParams,
  dependencies: SwapDependencies,
  tokens: Record<string, TokenInfo>
): Promise<SwapTokensResult> => {
  let retryCount = 0
  const swapContext: IndirectSwapContext = { state: 'PENDING_FIRST_TX' }

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
        return await performIndirectSwap(
          params,
          dependencies,
          tokens,
          retryCount,
          swapContext
        )
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
      errorStage: 'INDIRECT_SWAP_RETRY_EXHAUSTED',
      error: {
        type: SwapErrorType.UNKNOWN,
        message: `Indirect swap failed after ${JUPITER_MAX_RETRIES} retries: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      inputAmount: undefined,
      outputAmount: undefined,
      retryCount,
      maxRetries: JUPITER_MAX_RETRIES,
      isRetrying: false,
      firstTransactionSignature: swapContext.firstTransactionSignature
    }
  }
}

const performIndirectSwap = async (
  params: SwapTokensParams,
  dependencies: SwapDependencies,
  tokens: Record<string, TokenInfo>,
  currentRetryCount: number,
  swapContext: IndirectSwapContext
): Promise<SwapTokensResult> => {
  const {
    inputMint: inputMintUiAddress,
    outputMint: outputMintUiAddress,
    amountUi
  } = params

  let firstTransactionSignature = swapContext.firstTransactionSignature
  let firstQuote: JupiterQuoteResult | undefined
  let secondQuote: JupiterQuoteResult | undefined
  let intermediateAudioAta: PublicKey | undefined

  // Based on swap context state, execute appropriate transaction(s)
  if (swapContext.state === 'PENDING_FIRST_TX') {
    // Execute first transaction: InputToken -> AUDIO
    const firstTxResult = await executeFirstTransaction(
      params,
      dependencies,
      tokens
    )

    firstQuote = firstTxResult.firstQuote
    firstTransactionSignature = firstTxResult.signature
    intermediateAudioAta = firstTxResult.intermediateAudioAta

    // Update context for next retry if needed
    swapContext.state = 'PENDING_SECOND_TX'
    swapContext.firstTransactionSignature = firstTransactionSignature
    swapContext.intermediateAudioAta = intermediateAudioAta.toBase58()

    // Get second quote based on first transaction output
    const { quoteResult } = await getJupiterQuoteByMintWithRetry({
      inputMint: AUDIO_MINT,
      outputMint: outputMintUiAddress,
      inputDecimals: AUDIO_DECIMALS,
      outputDecimals: tokens[outputMintUiAddress]?.decimals || 6,
      amountUi: firstQuote.outputAmount.uiAmount,
      swapMode: 'ExactIn',
      onlyDirectRoutes: false
    })
    secondQuote = quoteResult
  } else if (swapContext.state === 'PENDING_SECOND_TX') {
    // First transaction already succeeded, only execute second transaction
    intermediateAudioAta = new PublicKey(swapContext.intermediateAudioAta!)

    // We need to reconstruct quotes for proper response format
    // In a real implementation, you might want to store these in the context
    const { quoteResult: reconstructedFirstQuote } =
      await getJupiterQuoteByMintWithRetry({
        inputMint: inputMintUiAddress,
        outputMint: AUDIO_MINT,
        inputDecimals: tokens[inputMintUiAddress]?.decimals || 6,
        outputDecimals: AUDIO_DECIMALS,
        amountUi,
        swapMode: 'ExactIn',
        onlyDirectRoutes: false
      })
    firstQuote = reconstructedFirstQuote

    const { quoteResult } = await getJupiterQuoteByMintWithRetry({
      inputMint: AUDIO_MINT,
      outputMint: outputMintUiAddress,
      inputDecimals: AUDIO_DECIMALS,
      outputDecimals: tokens[outputMintUiAddress]?.decimals || 6,
      amountUi: firstQuote.outputAmount.uiAmount,
      swapMode: 'ExactIn',
      onlyDirectRoutes: false
    })
    secondQuote = quoteResult
  }

  // Execute second transaction: AUDIO -> OutputToken
  if (!intermediateAudioAta) {
    throw new Error(
      'intermediateAudioAta is undefined - invalid swap context state'
    )
  }

  if (!secondQuote) {
    throw new Error('secondQuote is undefined - invalid swap context state')
  }

  const secondTxResult = await executeSecondTransaction(
    params,
    dependencies,
    tokens,
    secondQuote
  )

  // Mark as completed
  swapContext.state = 'COMPLETED'

  if (!firstQuote) {
    throw new Error('firstQuote is undefined - invalid swap context state')
  }

  return {
    status: SwapStatus.SUCCESS,
    signature: secondTxResult.signature,
    inputAmount: firstQuote.inputAmount,
    outputAmount: secondQuote.outputAmount,
    firstTransactionSignature,
    retryCount: currentRetryCount,
    maxRetries: JUPITER_MAX_RETRIES,
    isRetrying: false
  }
}

// Helper function to execute the first transaction (InputToken -> AUDIO)
const executeFirstTransaction = async (
  params: SwapTokensParams,
  dependencies: SwapDependencies,
  tokens: Record<string, TokenInfo>
): Promise<{
  firstQuote: JupiterQuoteResult
  signature: string
  intermediateAudioAta: PublicKey
}> => {
  const { inputMint: inputMintUiAddress, amountUi } = params
  const wrapUnwrapSol = params.wrapUnwrapSol ?? true

  const { sdk, keypair, userPublicKey, feePayer, ethAddress } = dependencies

  const firstInstructions: TransactionInstruction[] = []

  // Validate input token and create config
  const tokenConfigsResult = validateAndCreateTokenConfigs(
    inputMintUiAddress,
    AUDIO_MINT, // Use AUDIO as output for validation
    tokens
  )

  if ('error' in tokenConfigsResult) {
    throw new Error(
      `Token validation failed: ${tokenConfigsResult.error.error?.message}`
    )
  }

  const { inputTokenConfig } = tokenConfigsResult

  // Create AUDIO token config for transfers
  const audioTokenInfo = createTokenConfig(
    findTokenByAddress(tokens, AUDIO_MINT)!
  )

  // Get first quote: InputToken -> AUDIO
  const { quoteResult: firstQuote } = await getJupiterQuoteByMintWithRetry({
    inputMint: inputMintUiAddress,
    outputMint: AUDIO_MINT,
    inputDecimals: inputTokenConfig.decimals,
    outputDecimals: AUDIO_DECIMALS,
    amountUi,
    swapMode: 'ExactIn',
    onlyDirectRoutes: false
  })

  // Prepare input token for first swap
  const sourceAtaForJupiter = await addTransferFromUserBankInstructions({
    tokenInfo: inputTokenConfig,
    userPublicKey,
    ethAddress: ethAddress!,
    amountLamports: BigInt(firstQuote.inputAmount.amount),
    sdk,
    feePayer,
    instructions: firstInstructions
  })

  // Create intermediate AUDIO ATA
  const audioMint = new PublicKey(AUDIO_MINT)
  const intermediateAudioAta = getAssociatedTokenAddressSync(
    audioMint,
    userPublicKey,
    true
  )

  // Create ATA if it doesn't exist
  try {
    await getAccount(sdk.services.solanaClient.connection, intermediateAudioAta)
  } catch (e) {
    firstInstructions.push(
      createAssociatedTokenAccountIdempotentInstruction(
        feePayer,
        intermediateAudioAta,
        userPublicKey,
        audioMint
      )
    )
  }

  // Get first swap instructions (InputToken -> AUDIO)
  const firstSwapRequestParams: SwapRequest = {
    quoteResponse: firstQuote.quote,
    userPublicKey: userPublicKey.toBase58(),
    destinationTokenAccount: intermediateAudioAta.toBase58(),
    wrapAndUnwrapSol: wrapUnwrapSol,
    dynamicSlippage: true
  }

  const { swapInstructionsResult: firstSwapResponse } =
    await getJupiterSwapInstructions(firstSwapRequestParams)

  const firstSwapInstructions = convertJupiterInstructions([
    firstSwapResponse.swapInstruction
  ])

  firstInstructions.push(...firstSwapInstructions)

  // Transfer AUDIO back to user bank after first swap
  await addTransferToUserBankInstructions({
    tokenInfo: audioTokenInfo,
    userPublicKey,
    ethAddress: ethAddress!,
    amountLamports: BigInt(firstQuote.outputAmount.amount),
    sourceAta: intermediateAudioAta,
    sdk,
    feePayer,
    instructions: firstInstructions
  })

  // Cleanup source ATA after first swap
  firstInstructions.push(
    createCloseAccountInstruction(sourceAtaForJupiter, feePayer, userPublicKey)
  )

  // Build and send first transaction
  const signature = await buildAndSendTransaction(
    sdk,
    keypair,
    feePayer,
    firstInstructions,
    firstSwapResponse.addressLookupTableAddresses,
    'confirmed'
  )

  return {
    firstQuote,
    signature,
    intermediateAudioAta
  }
}

// Helper function to execute the second transaction (AUDIO -> OutputToken)
const executeSecondTransaction = async (
  params: SwapTokensParams,
  dependencies: SwapDependencies,
  tokens: Record<string, TokenInfo>,
  secondQuote: JupiterQuoteResult
): Promise<{
  signature: string
}> => {
  const { outputMint: outputMintUiAddress } = params
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

  const secondInstructions: TransactionInstruction[] = []

  // Validate output token config
  const tokenConfigsResult = validateAndCreateTokenConfigs(
    AUDIO_MINT, // Use AUDIO as input for validation
    outputMintUiAddress,
    tokens
  )

  if ('error' in tokenConfigsResult) {
    throw new Error(
      `Output token validation failed: ${tokenConfigsResult.error.error?.message}`
    )
  }

  const { outputTokenConfig } = tokenConfigsResult

  // Create AUDIO token config for transfers
  const audioTokenInfo = createTokenConfig(
    findTokenByAddress(tokens, AUDIO_MINT)!
  )

  // Transfer AUDIO from user bank to ATA for second swap
  const audioSourceAtaForJupiter = await addTransferFromUserBankInstructions({
    tokenInfo: audioTokenInfo,
    userPublicKey,
    ethAddress: ethAddress!,
    amountLamports: BigInt(secondQuote.inputAmount.amount),
    sdk,
    feePayer,
    instructions: secondInstructions
  })

  // Prepare output destination
  const preferredJupiterDestination = await prepareOutputUserBank(
    sdk,
    ethAddress!,
    outputTokenConfig
  )

  // Get second swap instructions (AUDIO -> OutputToken)
  const secondSwapRequestParams: SwapRequest = {
    quoteResponse: secondQuote.quote,
    userPublicKey: userPublicKey.toBase58(),
    destinationTokenAccount: preferredJupiterDestination,
    wrapAndUnwrapSol: wrapUnwrapSol,
    dynamicSlippage: true
  }

  const { swapInstructionsResult: secondSwapResponse, outputAtaForJupiter } =
    await getJupiterSwapInstructions(
      secondSwapRequestParams,
      outputTokenConfig,
      userPublicKey,
      feePayer,
      secondInstructions
    )

  const secondSwapInstructions = convertJupiterInstructions([
    secondSwapResponse.swapInstruction
  ])

  secondInstructions.push(...secondSwapInstructions)

  // Cleanup
  const atasToClose: PublicKey[] = [audioSourceAtaForJupiter]
  if (outputAtaForJupiter) {
    atasToClose.push(outputAtaForJupiter)
  }

  for (const ataToClose of atasToClose) {
    secondInstructions.push(
      createCloseAccountInstruction(ataToClose, feePayer, userPublicKey)
    )
  }

  // Build and send second transaction
  const signature = await buildAndSendTransaction(
    sdk,
    keypair,
    feePayer,
    secondInstructions,
    secondSwapResponse.addressLookupTableAddresses
  )

  // Invalidate queries
  await invalidateSwapQueries(queryClient, user)

  return {
    signature
  }
}
