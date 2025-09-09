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
  getJupiterQuoteByMintWithRetry
} from '~/services/Jupiter'
import { TokenInfo } from '~/store/ui/buy-sell/types'
import { TOKEN_LISTING_MAP } from '~/store/ui/shared/tokenConstants'

import {
  SwapDependencies,
  SwapTokensParams,
  SwapTokensResult,
  SwapStatus,
  SwapErrorType
} from './types'
import {
  addTransferFromUserBankInstructions,
  addTransferToUserBankInstructions,
  buildAndSendTransaction,
  createTokenConfig,
  findTokenByAddress,
  getJupiterSwapInstructions,
  invalidateSwapQueries,
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
  let errorStage = 'INDIRECT_SWAP_UNKNOWN'

  try {
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

    const firstInstructions: TransactionInstruction[] = []
    const secondInstructions: TransactionInstruction[] = []

    // Validate tokens and create configs
    errorStage = 'INDIRECT_SWAP_TOKEN_VALIDATION'
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

    // Create AUDIO token config for transfers
    errorStage = 'INDIRECT_SWAP_AUDIO_CONFIG'
    const audioTokenInfo = createTokenConfig(
      findTokenByAddress(tokens, AUDIO_MINT)!
    )

    // Get first quote: InputToken -> AUDIO
    errorStage = 'INDIRECT_SWAP_FIRST_QUOTE'
    const { quoteResult: firstQuote } = await getJupiterQuoteByMintWithRetry({
      inputMint: inputMintUiAddress,
      outputMint: AUDIO_MINT,
      inputDecimals: inputTokenConfig.decimals,
      outputDecimals: AUDIO_DECIMALS,
      amountUi,
      swapMode: 'ExactIn',
      onlyDirectRoutes: false
    })

    // Get second quote: AUDIO -> OutputToken
    errorStage = 'INDIRECT_SWAP_SECOND_QUOTE'
    const { quoteResult: secondQuote } = await getJupiterQuoteByMintWithRetry({
      inputMint: AUDIO_MINT,
      outputMint: outputMintUiAddress,
      inputDecimals: AUDIO_DECIMALS,
      outputDecimals: outputTokenConfig.decimals,
      amountUi: firstQuote.outputAmount.uiAmount,
      swapMode: 'ExactIn',
      onlyDirectRoutes: false
    })

    // Prepare input token for first swap
    errorStage = 'INDIRECT_SWAP_PREPARE_FIRST_INPUT'
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
    errorStage = 'INDIRECT_SWAP_CREATE_AUDIO_ATA'
    const audioMint = new PublicKey(AUDIO_MINT)
    const intermediateAudioAta = getAssociatedTokenAddressSync(
      audioMint,
      userPublicKey,
      true
    )

    // Create ATA if it doesn't exist
    try {
      await getAccount(
        sdk.services.solanaClient.connection,
        intermediateAudioAta
      )
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
    errorStage = 'INDIRECT_SWAP_FIRST_SWAP_INSTRUCTIONS'
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
    errorStage = 'INDIRECT_SWAP_TRANSFER_AUDIO_TO_BANK'
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
    errorStage = 'INDIRECT_SWAP_FIRST_CLEANUP'
    firstInstructions.push(
      createCloseAccountInstruction(
        sourceAtaForJupiter,
        feePayer,
        userPublicKey
      )
    )

    // Build and send first transaction
    errorStage = 'INDIRECT_SWAP_FIRST_TRANSACTION'
    const firstTransactionSignature = await buildAndSendTransaction(
      sdk,
      keypair,
      feePayer,
      firstInstructions,
      firstSwapResponse.addressLookupTableAddresses,
      'confirmed'
    )

    // Transfer AUDIO from user bank to ATA for second swap
    errorStage = 'INDIRECT_SWAP_PREPARE_SECOND_INPUT'
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
    errorStage = 'INDIRECT_SWAP_PREPARE_SECOND_OUTPUT'
    const preferredJupiterDestination = await prepareOutputUserBank(
      sdk,
      ethAddress!,
      outputTokenConfig
    )

    // Get second swap instructions (AUDIO -> OutputToken)
    errorStage = 'INDIRECT_SWAP_SECOND_SWAP_INSTRUCTIONS'
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
    errorStage = 'INDIRECT_SWAP_SECOND_CLEANUP'
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
    errorStage = 'INDIRECT_SWAP_SECOND_TRANSACTION'
    const signature = await buildAndSendTransaction(
      sdk,
      keypair,
      feePayer,
      secondInstructions,
      secondSwapResponse.addressLookupTableAddresses
    )

    // Invalidate queries
    errorStage = 'INDIRECT_SWAP_INVALIDATE_QUERIES'
    await invalidateSwapQueries(queryClient, user)

    return {
      status: SwapStatus.SUCCESS,
      signature,
      inputAmount: firstQuote.inputAmount,
      outputAmount: secondQuote.outputAmount,
      firstTransactionSignature
    }
  } catch (error: unknown) {
    return {
      status: SwapStatus.ERROR,
      errorStage,
      error: {
        type: SwapErrorType.UNKNOWN,
        message: `Indirect swap failed at stage ${errorStage}: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      inputAmount: undefined,
      outputAmount: undefined
    }
  }
}
