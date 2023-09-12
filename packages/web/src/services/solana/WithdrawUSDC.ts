import type { SwapMode } from '@jup-ag/core'
import {
  createCloseAccountInstruction,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token'
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionInstruction
} from '@solana/web3.js'
import BN from 'bn.js'

import { JupiterSingleton } from 'services/audius-backend/Jupiter'
import { getLibs } from 'services/audius-libs'
import {
  getRootSolanaAccount,
  getAssociatedTokenAccountRent,
  getTransferTransactionFee,
  getUSDCAssociatedTokenAccount
} from 'services/solana/solana'

// TODO: Grab from remote config
// Allowable slippage amount for USDC jupiter swaps in %.
const USDC_SLIPPAGE = 3

export const getFundDestinationTokenAccountFees = async (
  account: PublicKey
) => {
  // TODO: might have to pay rent for root sol account, see BuyAudio.ts
  const rent = await getAssociatedTokenAccountRent()
  const fee = await getTransferTransactionFee(account)
  return (rent + fee) / LAMPORTS_PER_SOL
}

/**
 * Creates instructions to swap USDC from a user bank into
 * SOL, which is deposited into the user's root solana account.
 */
export const getSwapUSDCUserBankInstructions = async ({
  amount,
  feePayer
}: {
  amount: number
  feePayer: PublicKey
}): Promise<TransactionInstruction[]> => {
  const libs = await getLibs()

  const solanaRootAccount = await getRootSolanaAccount()
  const usdcUserBank = await libs.solanaWeb3Manager!.deriveUserBank({
    mint: 'usdc'
  })
  const solanaUSDCAssociatedTokenAccount = await getUSDCAssociatedTokenAccount(
    solanaRootAccount.publicKey
  )
  const quoteRoute = await JupiterSingleton.getQuote({
    inputTokenSymbol: 'USDC',
    outputTokenSymbol: 'SOL',
    inputAmount: amount,
    slippage: USDC_SLIPPAGE,
    swapMode: 'ExactOut' as SwapMode,
    onlyDirectRoutes: true
  })
  const usdcNeededAmount = quoteRoute.inputAmount
  const swapRoute = await JupiterSingleton.getQuote({
    inputTokenSymbol: 'USDC',
    outputTokenSymbol: 'SOL',
    inputAmount: usdcNeededAmount.uiAmount,
    slippage: USDC_SLIPPAGE,
    swapMode: 'ExactIn' as SwapMode,
    forceFetch: true,
    onlyDirectRoutes: true
  })
  const exchangeInfo = await JupiterSingleton.exchange({
    routeInfo: swapRoute.route,
    userPublicKey: solanaRootAccount.publicKey,
    feeAccount: feePayer
  })
  const swapInstructions = [
    ...(exchangeInfo.transactions.setupTransaction?.instructions ?? []),
    ...exchangeInfo.transactions.swapTransaction.instructions,
    ...(exchangeInfo.transactions.cleanupTransaction?.instructions ?? [])
  ]

  const transferInstructions =
    await libs.solanaWeb3Manager!.createTransferInstructionsFromCurrentUser({
      amount: new BN(usdcNeededAmount.uiAmount),
      feePayerKey: feePayer,
      senderSolanaAddress: usdcUserBank,
      recipientSolanaAddress: solanaUSDCAssociatedTokenAccount.toString(),
      instructionIndex: 1,
      mint: 'usdc'
    })

  const createInstruction = createAssociatedTokenAccountInstruction(
    feePayer, // fee payer
    solanaUSDCAssociatedTokenAccount, // account to create
    solanaRootAccount.publicKey, // owner
    libs.solanaWeb3Manager!.mints.usdc // mint
  )
  const closeInstruction = createCloseAccountInstruction(
    solanaUSDCAssociatedTokenAccount, //  account to close
    feePayer, // fee destination
    solanaRootAccount.publicKey //  owner
  )

  return [
    createInstruction,
    ...transferInstructions,
    ...swapInstructions,
    closeInstruction
  ]
}
