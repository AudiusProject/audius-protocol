import {
  withdrawUSDCActions,
  solanaSelectors,
  ErrorLevel,
  SolanaWalletAddress,
  getUSDCUserBank,
  getContext,
  TOKEN_LISTING_MAP
} from '@audius/common'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  Token
} from '@solana/spl-token'
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction
} from '@solana/web3.js'
import BN from 'bn.js'
import { takeLatest } from 'redux-saga/effects'
import { call, put, select } from 'typed-redux-saga'

import { getLibs } from 'services/audius-libs'
import {
  getSwapUSDCUserBankInstructions,
  getFundDestinationTokenAccountFees
} from 'services/solana/WithdrawUSDC'
import {
  isSolWallet,
  getTokenAccountInfo,
  isValidSolAddress,
  getRootSolanaAccount,
  getSignatureForTransaction,
  createAssociatedTokenAccountInstruction,
  getRecentBlockhash,
  ROOT_ACCOUNT_SIZE
} from 'services/solana/solana'

const {
  beginWithdrawUSDC,
  setAmount,
  setAmountFailed,
  setAmountSucceeded,
  setDestinationAddress,
  setDestinationAddressFailed,
  setDestinationAddressSucceeded,
  withdrawUSDCFailed,
  withdrawUSDCSucceeded
} = withdrawUSDCActions
const { getFeePayer } = solanaSelectors

function* doSetAmount({ payload: { amount } }: ReturnType<typeof setAmount>) {
  try {
    const amountBN = new BN(amount)
    if (amountBN.lte(new BN(0))) {
      throw new Error('Please enter a valid amount')
    }
    // get user bank
    const userBank = yield* call(getUSDCUserBank)
    const tokenAccountInfo = yield* call(getTokenAccountInfo, {
      tokenAccount: userBank,
      mint: 'usdc'
    })
    if (!tokenAccountInfo) {
      throw new Error('Failed to fetch USDC token account info')
    }
    if (tokenAccountInfo.amount.gt(amountBN)) {
      throw new Error(
        `Your USDC wallet does not have enough funds to cover this transaction.`
      )
    }
    yield* put(setAmountSucceeded({ amount }))
  } catch (e: unknown) {
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error
    })
    yield* put(setAmountFailed({ error: e as Error }))
  }
}

function* doSetDestinationAddress({
  payload: { destinationAddress }
}: ReturnType<typeof setDestinationAddress>) {
  try {
    if (!destinationAddress) {
      throw new Error('Please enter a destination address')
    }
    const isValidAddress = yield* call(
      isValidSolAddress,
      destinationAddress as SolanaWalletAddress
    )
    if (!isValidAddress) {
      throw new Error('A valid Solana USDC wallet address is required.')
    }
    yield* put(setDestinationAddressSucceeded({ destinationAddress }))
  } catch (e: unknown) {
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error
    })
    yield* put(setDestinationAddressFailed({ error: e as Error }))
  }
}

/**
 * Handles all logic for withdrawing USDC to a given destination. Expects amount in dollars.
 */
function* doWithdrawUSDC({
  payload: { amount, destinationAddress, onSuccess }
}: ReturnType<typeof beginWithdrawUSDC>) {
  try {
    const libs = yield* call(getLibs)
    if (!libs.solanaWeb3Manager) {
      throw new Error('Failed to get solana web3 manager')
    }
    // Assume destinationAddress and amount have already been validated
    if (!destinationAddress || !amount) {
      throw new Error('Please enter a valid destination address and amount')
    }
    const feePayer = yield* select(getFeePayer)
    if (feePayer === null) {
      throw new Error('Fee payer not set')
    }
    const transactionHandler = libs.solanaWeb3Manager.transactionHandler
    const connection = libs.solanaWeb3Manager.connection
    if (!connection) {
      throw new Error('Failed to get connection')
    }
    const rootSolanaAccount = yield* call(getRootSolanaAccount)
    if (!transactionHandler) {
      throw new Error('Failed to get transaction handler')
    }

    const destinationPubkey = new PublicKey(destinationAddress)
    const feePayerPubkey = new PublicKey(feePayer)

    const isDestinationSolAddress = yield* call(
      isSolWallet,
      destinationAddress as SolanaWalletAddress
    )
    // Destination is a sol address - check for associated token account
    if (isDestinationSolAddress) {
      // First check that the destination actually exists and has enough lamports for rent
      const destinationTokenAccountPubkey = yield* call(
        [Token, Token.getAssociatedTokenAddress],
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        libs.solanaWeb3Manager.mints.usdc,
        destinationPubkey
      )
      const tokenAccountInfo = yield* call(getTokenAccountInfo, {
        tokenAccount: destinationTokenAccountPubkey,
        mint: 'usdc'
      })
      // Destination associated token account does not exist - create and fund it
      if (tokenAccountInfo === null) {
        console.debug(
          'Withdraw USDC - destination associated token account does not exist'
        )
        // Check if there is enough SOL to fund the destination associated token account
        const feeAmount = yield* call(
          getFundDestinationTokenAccountFees,
          new PublicKey(destinationAddress)
        )
        const existingBalance =
          (yield* call(
            [connection, connection.getBalance],
            rootSolanaAccount.publicKey
          )) / LAMPORTS_PER_SOL
        // Need to maintain a minimum balance to pay rent for root solana account
        const rootSolanaAccountRent =
          (yield* call(
            [connection, connection.getMinimumBalanceForRentExemption],
            ROOT_ACCOUNT_SIZE
          )) / LAMPORTS_PER_SOL

        if (feeAmount > existingBalance - rootSolanaAccountRent) {
          // Swap USDC for SOL to fund the destination associated token account
          console.debug(
            `Withdraw USDC - not enough SOL to fund destination account, attempting to swap USDC for SOL. Fee amount: ${feeAmount}, existing balance: ${existingBalance}, rent for root solana account: ${rootSolanaAccountRent}, amount needed: ${
              feeAmount - (existingBalance - rootSolanaAccountRent)
            }`
          )
          const swapInstructions = yield* call(
            getSwapUSDCUserBankInstructions,
            {
              amount: feeAmount - existingBalance,
              feePayer: feePayerPubkey
            }
          )
          const swapRecentBlockhash = yield* call(getRecentBlockhash)
          const signatureWithPubkey = yield* call(getSignatureForTransaction, {
            instructions: swapInstructions,
            signer: rootSolanaAccount,
            feePayer: feePayerPubkey,
            recentBlockhash: swapRecentBlockhash
          })
          // Send swap instructions to relay
          const { res: swapRes, error: swapError } = yield* call(
            [transactionHandler, transactionHandler.handleTransaction],
            {
              instructions: swapInstructions,
              feePayerOverride: feePayerPubkey,
              skipPreflight: false,
              signatures: signatureWithPubkey.map((s) => ({
                signature: s.signature!,
                publicKey: s.publicKey.toString()
              })),
              recentBlockhash: swapRecentBlockhash
            }
          )
          if (swapError) {
            throw new Error(`Swap transaction failed: ${swapError}`)
          }
          console.debug(`Withdraw USDC - swap successful: ${swapRes}`)
        }

        // Then create and fund the destination associated token account
        const createRecentBlockhash = yield* call(getRecentBlockhash)
        const tx = new Transaction({ recentBlockhash: createRecentBlockhash })
        const createTokenAccountInstruction = yield* call(
          createAssociatedTokenAccountInstruction,
          {
            associatedTokenAccount: destinationTokenAccountPubkey,
            owner: destinationPubkey,
            mint: libs.solanaWeb3Manager.mints.usdc,
            feePayer: rootSolanaAccount.publicKey
          }
        )
        yield* call([tx, tx.add], createTokenAccountInstruction)
        yield* call(
          sendAndConfirmTransaction,
          libs.solanaWeb3Manager.connection,
          tx,
          [rootSolanaAccount]
        )
        console.debug(
          'Withdraw USDC - successfully created destination associated token account'
        )
      }
    }
    // TODO: math.min(amount, balance)
    // https://linear.app/audius/issue/PAY-1794/account-for-usdc-used-for-fees-before-withdrawing
    let destinationTokenAccount = destinationAddress
    if (isDestinationSolAddress) {
      const destinationTokenAccountPubkey = yield* call(
        [Token, Token.getAssociatedTokenAddress],
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        libs.solanaWeb3Manager.mints.usdc,
        destinationPubkey
      )
      destinationTokenAccount = destinationTokenAccountPubkey.toString()
    }
    // Multiply by 10^6 to account for USDC decimals, but also convert from cents to dollars
    const amountWei = new BN(amount)
      .mul(new BN(10 ** TOKEN_LISTING_MAP.USDC.decimals))
      .div(new BN(100))
    const usdcUserBank = yield* call(getUSDCUserBank)
    const transferInstructions = yield* call(
      [
        libs.solanaWeb3Manager,
        libs.solanaWeb3Manager.createTransferInstructionsFromCurrentUser
      ],
      {
        amount: amountWei,
        feePayerKey: rootSolanaAccount.publicKey,
        senderSolanaAddress: usdcUserBank,
        recipientSolanaAddress: destinationTokenAccount,
        mint: 'usdc'
      }
    )
    const recentBlockhash = yield* call(getRecentBlockhash)
    const tx = new Transaction({ recentBlockhash })
    for (const inst of transferInstructions) {
      yield* call([tx, tx.add], inst)
    }
    const transferSignature = yield* call(
      sendAndConfirmTransaction,
      libs.solanaWeb3Manager.connection,
      tx,
      [rootSolanaAccount]
    )
    console.debug(
      'Withdraw USDC - successfully transferred USDC - tx hash',
      transferSignature
    )
    yield* call(onSuccess, transferSignature)
    yield* put(withdrawUSDCSucceeded())
  } catch (e: unknown) {
    console.error('Withdraw USDC failed', e)
    const reportToSentry = yield* getContext('reportToSentry')
    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error
    })
    yield* put(withdrawUSDCFailed({ error: e as Error }))
  }
}

function* watchSetAmount() {
  yield takeLatest(setAmount, doSetAmount)
}

function* watchSetDestinationAddress() {
  yield takeLatest(setDestinationAddress, doSetDestinationAddress)
}

function* watchBeginWithdrawUSDC() {
  yield takeLatest(beginWithdrawUSDC, doWithdrawUSDC)
}

export default function sagas() {
  return [watchSetAmount, watchSetDestinationAddress, watchBeginWithdrawUSDC]
}
