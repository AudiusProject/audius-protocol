import {
  withdrawUSDCActions,
  withdrawUSDCSelectors,
  solanaSelectors,
  ErrorLevel,
  SolanaWalletAddress,
  getUSDCUserBank,
  getContext
} from '@audius/common'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  Token
} from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { takeLatest } from 'redux-saga/effects'
import { call, put, select } from 'typed-redux-saga'

import { getLibs } from 'services/audius-libs'
import { getSwapUSDCUserBankInstructions } from 'services/solana/WithdrawUSDC'
import {
  isSolWallet,
  getTokenAccountInfo,
  isValidSolAddress,
  getRootSolanaAccount,
  getSignatureForTransaction,
  getRecentBlockhash
} from 'services/solana/solana'

const {
  beginWithdrawUSDC,
  setAmount,
  setAmountFailed,
  setAmountSucceeded,
  setDestinationAddress,
  setDestinationAddressFailed,
  setDestinationAddressSucceeded,
  withdrawUSDCFailed
} = withdrawUSDCActions
const { getWithdrawDestinationAddress } = withdrawUSDCSelectors
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

function* doWithdrawUSDC({ payload }: ReturnType<typeof beginWithdrawUSDC>) {
  try {
    const libs = yield* call(getLibs)
    // Assume destinationAddress and amount have already been validated
    const destinationAddress = yield* select(getWithdrawDestinationAddress)
    if (!destinationAddress) {
      throw new Error('Please enter a destination address')
    }
    const feePayer = yield* select(getFeePayer)
    if (feePayer === null) {
      throw new Error('Fee payer not set')
    }
    const transactionHandler = libs.solanaWeb3Manager?.transactionHandler
    const connection = libs.solanaWeb3Manager?.connection
    if (!connection) {
      throw new Error('Failed to get connection')
    }
    const rootSolanaAccount = yield* call(getRootSolanaAccount)
    if (!transactionHandler) {
      throw new Error('Failed to get transaction handler')
    }

    let destinationPubkey = new PublicKey(destinationAddress)
    const feePayerPubkey = new PublicKey(feePayer)

    const isDestinationSolAddress = yield* call(
      isSolWallet,
      destinationAddress as SolanaWalletAddress
    )
    // Destination is a sol address - check for associated token account
    if (isDestinationSolAddress) {
      const destinationTokenPubkey = yield* call(
        [Token, Token.getAssociatedTokenAddress],
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        libs.solanaWeb3Manager!.mints.usdc,
        destinationPubkey
      )
      destinationPubkey = destinationTokenPubkey
      const tokenAccountInfo = yield* call(getTokenAccountInfo, {
        tokenAccount: destinationTokenPubkey,
        mint: 'usdc'
      })
      // Destination associated token account does not exist - create and fund it
      if (tokenAccountInfo === null) {
        console.debug(
          'Withdraw USDC - destination associated token account does not exist'
        )
        // First swap some USDC for SOL to fund the destination associated token account
        const swapInstructions = yield* call(getSwapUSDCUserBankInstructions, {
          destinationAddress,
          feePayer: feePayerPubkey
        })
        const recentBlockhash = yield* call(getRecentBlockhash)
        const signatureWithPubkey = yield* call(getSignatureForTransaction, {
          instructions: swapInstructions,
          signer: rootSolanaAccount,
          feePayer: feePayerPubkey,
          recentBlockhash
        })
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
            recentBlockhash
          }
        )
        if (swapError) {
          throw new Error(`Swap transaction failed: ${swapError}`)
        }
        console.debug(`Withdraw USDC - swap successful: ${swapRes}`)
      }
    }
    // TODO: handle case where destination is a USDC associated token account
  } catch (e: unknown) {
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
