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
  addAtaToUserBankInstructions,
  addUserBankToAtaInstructions,
  buildAndSendTransaction,
  getJupiterSwapInstructions,
  invalidateSwapQueries,
  validateAndCreateTokenConfigs
} from './utils'

// AUDIO mint address for use as intermediary token
const AUDIO_MINT = TOKEN_LISTING_MAP.AUDIO.address

export const executeDoubleSwap = async (
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

  // Get first quote: InputToken -> AUDIO
  const { quoteResult: firstQuote } = await getJupiterQuoteByMintWithRetry({
    inputMint: inputMintUiAddress,
    outputMint: AUDIO_MINT,
    amountUi,
    swapMode: 'ExactIn',
    onlyDirectRoutes: false
  })

  // Get second quote: AUDIO -> OutputToken
  const { quoteResult: secondQuote } = await getJupiterQuoteByMintWithRetry({
    inputMint: AUDIO_MINT,
    outputMint: outputMintUiAddress,
    amountUi: firstQuote.outputAmount.uiAmount,
    swapMode: 'ExactIn',
    onlyDirectRoutes: false
  })

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

  // Prepare input token for first swap
  const sourceAtaForJupiter = await addUserBankToAtaInstructions({
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
    firstSwapResponse.addressLookupTableAddresses
  )

  // Create destination ATA for output token
  const outputMint = new PublicKey(outputMintUiAddress)
  const destinationAta = getAssociatedTokenAddressSync(
    outputMint,
    userPublicKey,
    true
  )

  // Create ATA if it doesn't exist
  try {
    await getAccount(sdk.services.solanaClient.connection, destinationAta)
  } catch (e) {
    secondInstructions.push(
      createAssociatedTokenAccountIdempotentInstruction(
        feePayer,
        destinationAta,
        userPublicKey,
        outputMint
      )
    )
  }

  // Get second swap instructions (AUDIO -> OutputToken)
  const secondSwapRequestParams: SwapRequest = {
    quoteResponse: secondQuote.quote,
    userPublicKey: userPublicKey.toBase58(),
    destinationTokenAccount: destinationAta.toBase58(),
    wrapAndUnwrapSol: wrapUnwrapSol,
    dynamicSlippage: true
  }

  const { swapInstructionsResult: secondSwapResponse } =
    await getJupiterSwapInstructions(secondSwapRequestParams)

  const secondSwapInstructions = convertJupiterInstructions([
    secondSwapResponse.swapInstruction
  ])

  secondInstructions.push(...secondSwapInstructions)

  // Transfer tokens from destination ATA to user bank
  await addAtaToUserBankInstructions({
    tokenInfo: outputTokenConfig,
    userPublicKey,
    ethAddress: ethAddress!,
    amountLamports: BigInt(secondQuote.outputAmount.amount),
    sourceAta: destinationAta,
    sdk,
    feePayer,
    instructions: secondInstructions
  })

  // Cleanup intermediate AUDIO ATA after second swap
  secondInstructions.push(
    createCloseAccountInstruction(intermediateAudioAta, feePayer, userPublicKey)
  )

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
    // Store first transaction signature for debugging double swaps
    firstTransactionSignature
  }
}
