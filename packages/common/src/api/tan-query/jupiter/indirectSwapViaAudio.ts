import { SwapRequest } from '@jup-ag/api'
import { createCloseAccountInstruction } from '@solana/spl-token'
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
  let errorStage = 'INDIRECT_SWAP_UNKNOWN'

  try {
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
      errorStage = 'INDIRECT_SWAP_FIRST_TRANSACTION'
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
      errorStage = 'INDIRECT_SWAP_SECOND_QUOTE'
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
      errorStage = 'INDIRECT_SWAP_RECONSTRUCT_FIRST_QUOTE'
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

      errorStage = 'INDIRECT_SWAP_SECOND_QUOTE'
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

    errorStage = 'INDIRECT_SWAP_SECOND_TRANSACTION'
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
  } catch (error: unknown) {
    throw new Error(
      `Indirect swap failed at stage ${errorStage}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
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
  let errorStage = 'FIRST_TX_UNKNOWN'

  try {
    const { inputMint: inputMintUiAddress, amountUi } = params
    const wrapUnwrapSol = params.wrapUnwrapSol ?? true

    const { sdk, keypair, userPublicKey, feePayer, ethAddress } = dependencies

    const firstInstructions: TransactionInstruction[] = []

    // Validate input token and create config
    errorStage = 'FIRST_TX_TOKEN_VALIDATION'
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
    errorStage = 'FIRST_TX_AUDIO_CONFIG'
    const audioTokenInfo = createTokenConfig(
      findTokenByAddress(tokens, AUDIO_MINT)!
    )

    // Get first quote: InputToken -> AUDIO
    errorStage = 'FIRST_TX_QUOTE'
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
    errorStage = 'FIRST_TX_PREPARE_INPUT'
    const sourceAtaForJupiter = await addTransferFromUserBankInstructions({
      tokenInfo: inputTokenConfig,
      userPublicKey,
      ethAddress: ethAddress!,
      amountLamports: BigInt(firstQuote.inputAmount.amount),
      sdk,
      feePayer,
      instructions: firstInstructions
    })

    // Get/create AUDIO user bank (from commit 9557c2e)
    errorStage = 'FIRST_TX_PREPARE_AUDIO_USER_BANK'
    const audioUserBankResult =
      await sdk.services.claimableTokensClient.getOrCreateUserBank({
        ethWallet: ethAddress,
        mint: audioTokenInfo.claimableTokenMint
      })
    const audioUserBank = audioUserBankResult.userBank

    // Get first swap instructions (InputToken -> AUDIO)
    errorStage = 'FIRST_TX_SWAP_INSTRUCTIONS'
    const firstSwapRequestParams: SwapRequest = {
      quoteResponse: firstQuote.quote,
      userPublicKey: userPublicKey.toBase58(),
      destinationTokenAccount: audioUserBank.toBase58(),
      wrapAndUnwrapSol: wrapUnwrapSol,
      dynamicSlippage: true
    }

    const { swapInstructionsResult: firstSwapResponse } =
      await getJupiterSwapInstructions(firstSwapRequestParams)

    const firstSwapInstructions = convertJupiterInstructions([
      firstSwapResponse.swapInstruction
    ])

    firstInstructions.push(...firstSwapInstructions)

    // Cleanup source ATA after first swap
    errorStage = 'FIRST_TX_CLEANUP'
    firstInstructions.push(
      createCloseAccountInstruction(
        sourceAtaForJupiter,
        feePayer,
        userPublicKey
      )
    )

    // Build and send first transaction
    errorStage = 'FIRST_TX_BUILD_AND_SEND'
    const signature = await buildAndSendTransaction(
      sdk,
      keypair,
      feePayer,
      firstInstructions,
      firstSwapResponse.addressLookupTableAddresses,
      'confirmed'
    )

    // Return audioUserBank as intermediateAudioAta for compatibility
    return {
      firstQuote,
      signature,
      intermediateAudioAta: audioUserBank
    }
  } catch (error: unknown) {
    throw new Error(
      `First transaction failed at stage ${errorStage}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
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
  let errorStage = 'SECOND_TX_UNKNOWN'

  try {
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
    errorStage = 'SECOND_TX_TOKEN_VALIDATION'
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
    errorStage = 'SECOND_TX_AUDIO_CONFIG'
    const audioTokenInfo = createTokenConfig(
      findTokenByAddress(tokens, AUDIO_MINT)!
    )

    // Transfer AUDIO from user bank to ATA for second swap
    errorStage = 'SECOND_TX_PREPARE_AUDIO_INPUT'
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
    errorStage = 'SECOND_TX_PREPARE_OUTPUT'
    const preferredJupiterDestination = await prepareOutputUserBank(
      sdk,
      ethAddress!,
      outputTokenConfig
    )

    // Get second swap instructions (AUDIO -> OutputToken)
    errorStage = 'SECOND_TX_SWAP_INSTRUCTIONS'
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
    errorStage = 'SECOND_TX_CLEANUP'
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
    errorStage = 'SECOND_TX_BUILD_AND_SEND'
    const signature = await buildAndSendTransaction(
      sdk,
      keypair,
      feePayer,
      secondInstructions,
      secondSwapResponse.addressLookupTableAddresses
    )

    // Invalidate queries
    errorStage = 'SECOND_TX_INVALIDATE_QUERIES'
    await invalidateSwapQueries(queryClient, user)

    return {
      signature
    }
  } catch (error: unknown) {
    throw new Error(
      `Second transaction failed at stage ${errorStage}: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
