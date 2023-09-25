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
}): Promise<{
  instructions: TransactionInstruction[]
  lookupTableAddresses: string[]
}> => {
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
    swapMode: 'ExactOut',
    onlyDirectRoutes: true
  })
  const usdcNeededAmount = quoteRoute.inputAmount.amount
  const swapQuote = await JupiterSingleton.getQuote({
    inputTokenSymbol: 'USDC',
    outputTokenSymbol: 'SOL',
    inputAmount: usdcNeededAmount,
    slippage: USDC_SLIPPAGE,
    swapMode: 'ExactIn',
    onlyDirectRoutes: true
  })
  const { instructions: swapInstructions, lookupTableAddresses } =
    await JupiterSingleton.getSwapInstructions({
      quote: swapQuote.quote,
      userPublicKey: solanaRootAccount.publicKey
    })

  const transferInstructions =
    await libs.solanaWeb3Manager!.createTransferInstructionsFromCurrentUser({
      amount: new BN(usdcNeededAmount),
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

  return {
    instructions: [
      createInstruction,
      ...transferInstructions,
      ...swapInstructions,
      closeInstruction
    ],
    lookupTableAddresses
  }
}
