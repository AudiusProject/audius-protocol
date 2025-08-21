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
  SwapStatus
} from './types'
import {
  addUserBankToAtaInstructions,
  buildAndSendTransaction,
  getJupiterSwapInstructions,
  invalidateSwapQueries,
  prepareOutputUserBank,
  validateAndCreateTokenConfigs
} from './utils'

export const executeDirectSwap = async (
  params: SwapTokensParams,
  dependencies: SwapDependencies,
  tokens: Record<string, TokenInfo>
): Promise<SwapTokensResult> => {
  const {
    inputMint: inputMintUiAddress,
    outputMint: outputMintUiAddress,
    amountUi
  } = params
  const slippageBps = params.slippageBps ?? 50
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

  // Get quote
  const { quoteResult: quote } = await getJupiterQuoteByMintWithRetry({
    inputMint: inputMintUiAddress,
    outputMint: outputMintUiAddress,
    amountUi,
    slippageBps,
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

  // Prepare input token
  const sourceAtaForJupiter = await addUserBankToAtaInstructions({
    tokenInfo: inputTokenConfig,
    userPublicKey,
    ethAddress: ethAddress!,
    amountLamports: BigInt(quote.inputAmount.amount),
    sdk,
    feePayer,
    instructions
  })
  // Prepare output destination
  const preferredJupiterDestination = await prepareOutputUserBank(
    sdk,
    ethAddress!,
    outputTokenConfig
  )

  // Get swap instructions
  const swapRequestParams: SwapRequest = {
    quoteResponse: quote.quote,
    userPublicKey: userPublicKey.toBase58(),
    destinationTokenAccount: preferredJupiterDestination,
    wrapAndUnwrapSol: wrapUnwrapSol
  }

  const { swapInstructionsResult, outputAtaForJupiter } =
    await getJupiterSwapInstructions(
      swapRequestParams,
      outputTokenConfig,
      userPublicKey,
      feePayer,
      instructions
    )
  const {
    tokenLedgerInstruction,
    swapInstruction,
    addressLookupTableAddresses
  } = swapInstructionsResult

  const jupiterInstructions = convertJupiterInstructions([
    tokenLedgerInstruction,
    swapInstruction
  ])

  instructions.push(...jupiterInstructions)

  // Cleanup
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
  const signature = await buildAndSendTransaction(
    sdk,
    keypair,
    feePayer,
    instructions,
    addressLookupTableAddresses
  )

  // Invalidate queries
  await invalidateSwapQueries(queryClient, user)

  return {
    status: SwapStatus.SUCCESS,
    signature,
    inputAmount: quote.inputAmount,
    outputAmount: quote.outputAmount
  }
}
