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
  SwapStatus
} from './types'
import {
  addTransferFromUserBankInstructions,
  buildAndSendTransaction,
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
  const tokenConfigsResult = validateAndCreateTokenConfigs(
    inputMintUiAddress,
    outputMintUiAddress,
    tokens
  )

  if ('error' in tokenConfigsResult) {
    return tokenConfigsResult.error
  }

  const { inputTokenConfig, outputTokenConfig } = tokenConfigsResult

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

  // Get second quote: AUDIO -> OutputToken
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

  // Cleanup source ATA after first swap
  firstInstructions.push(
    createCloseAccountInstruction(sourceAtaForJupiter, feePayer, userPublicKey)
  )

  // Build and send first transaction
  const firstTransactionSignature = await buildAndSendTransaction(
    sdk,
    keypair,
    feePayer,
    firstInstructions,
    firstSwapResponse.addressLookupTableAddresses,
    'finalized'
  )

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
  const atasToClose: PublicKey[] = [intermediateAudioAta]
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
    status: SwapStatus.SUCCESS,
    signature,
    inputAmount: firstQuote.inputAmount,
    outputAmount: secondQuote.outputAmount,
    firstTransactionSignature
  }
}
