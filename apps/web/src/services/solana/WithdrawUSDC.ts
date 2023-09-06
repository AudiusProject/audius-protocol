import type { SwapMode } from '@jup-ag/core'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
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
  getUSDCAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction
} from 'services/solana/solana'

// TODO: Grab from remote config
// Allowable slippage amount for USDC jupiter swaps in %.
const USDC_SLIPPAGE = 3

const getWithdrawUSDCFees = async (account: PublicKey) => {
  // TODO: factor in existing sol balance
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
  destinationAddress,
  feePayer
}: {
  destinationAddress: string
  feePayer: PublicKey
}): Promise<TransactionInstruction[]> => {
  const libs = await getLibs()

  // Destination associated token account does not exist - create and fund it
  const feeAmount = await getWithdrawUSDCFees(new PublicKey(destinationAddress))
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
    inputAmount: feeAmount,
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

  const createInstruction = createAssociatedTokenAccountInstruction({
    associatedTokenAccount: solanaUSDCAssociatedTokenAccount,
    owner: solanaRootAccount.publicKey,
    mint: libs.solanaWeb3Manager!.mints.usdc,
    feePayer
  })
  const closeInstruction = Token.createCloseAccountInstruction(
    TOKEN_PROGRAM_ID, //    programId
    solanaUSDCAssociatedTokenAccount, //  account to close
    feePayer, // fee destination
    solanaRootAccount.publicKey, //  owner
    [] //  multiSigners
  )

  return [
    createInstruction,
    ...transferInstructions,
    ...swapInstructions,
    closeInstruction
  ]
}
