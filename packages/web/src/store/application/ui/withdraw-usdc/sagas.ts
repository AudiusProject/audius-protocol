import {
  withdrawUSDCActions,
  solanaSelectors,
  ErrorLevel,
  SolanaWalletAddress,
  getUSDCUserBank,
  getContext,
  TOKEN_LISTING_MAP,
  getUserbankAccountInfo,
  BNUSDC,
  formatUSDCWeiToFloorDollarNumber,
  userApiActions
} from '@audius/common'
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync
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
  isTokenAccount,
  getTokenAccountInfo,
  getRootSolanaAccount,
  getRecentBlockhash,
  ROOT_ACCOUNT_SIZE,
  getSignatureForV0Transaction
} from 'services/solana/solana'

const { beginWithdrawUSDC, withdrawUSDCFailed, withdrawUSDCSucceeded } =
  withdrawUSDCActions
const { getFeePayer } = solanaSelectors

/**
 * Handles all logic for withdrawing USDC to a given destination. Expects amount in dollars.
 */
function* doWithdrawUSDC({
  payload
}: // payload: { amount, destinationAddress, onSuccess }
ReturnType<typeof beginWithdrawUSDC>) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  try {
    const libs = yield* call(getLibs)
    if (!libs.solanaWeb3Manager) {
      throw new Error('Failed to get solana web3 manager')
    }
    const destinationAddress = '5iqAf63bGNUVR1Qf2pUWsUikeGXXA6XeYctJnSMdK4fK'
    const amount = 0.01
    // Assume destinationAddress and amount have already been validated
    if (!destinationAddress || !amount) {
      throw new Error('Please enter a valid destination address and amount')
    }

    let withdrawalAmount = amount

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

    const isTokenAccountAddress = yield* call(isTokenAccount, {
      accountAddress: destinationAddress as SolanaWalletAddress,
      mint: 'usdc'
    })
    // Destination is a sol address - check for associated token account
    if (!isTokenAccountAddress) {
      // First check that the destination actually exists and has enough lamports for rent
      const destinationTokenAccountPubkey = yield* call(
        getAssociatedTokenAddressSync,
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
          const { instructions: swapInstructions, lookupTableAddresses } =
            yield* call(getSwapUSDCUserBankInstructions, {
              amount: feeAmount - existingBalance,
              feePayer: feePayerPubkey
            })
          const swapRecentBlockhash = yield* call(getRecentBlockhash)
          console.debug(
            'REED feePayerPubkey in saga',
            feePayerPubkey.toString()
          )
          console.debug(
            'REED feePayerPubkey in saga',
            feePayerPubkey.toBase58()
          )
          const signature = yield* call(getSignatureForV0Transaction, {
            instructions: swapInstructions,
            signer: rootSolanaAccount,
            feePayer: feePayerPubkey,
            recentBlockhash: swapRecentBlockhash,
            lookupTableAddresses
          })

          console.debug('REED signature in saga', signature)
          // Send swap instructions to relay
          const { res: swapRes, error: swapError } = yield* call(
            [transactionHandler, transactionHandler.handleTransaction],
            {
              instructions: swapInstructions,
              feePayerOverride: feePayerPubkey,
              skipPreflight: false,
              signatures: signature,
              recentBlockhash: swapRecentBlockhash,
              lookupTableAddresses
            }
          )
          if (swapError) {
            throw new Error(`Swap transaction failed: ${swapError}`)
          }

          console.debug(`Withdraw USDC - swap successful: ${swapRes}`)

          // At this point, we have swapped some USDC for SOL. Make sure that we are able
          // to still withdraw the amount we specified, and if not, withdraw as much as we can.
          const accountInfo = yield* call(
            getUserbankAccountInfo,
            audiusBackendInstance,
            { mint: 'usdc' }
          )
          const latestBalance = (accountInfo?.amount ?? new BN(0)) as BNUSDC
          withdrawalAmount = Math.min(
            withdrawalAmount,
            formatUSDCWeiToFloorDollarNumber(latestBalance)
          )
        }

        // Then create and fund the destination associated token account
        const createRecentBlockhash = yield* call(getRecentBlockhash)
        const tx = new Transaction()
        tx.recentBlockhash = createRecentBlockhash
        const createTokenAccountInstruction = yield* call(
          createAssociatedTokenAccountInstruction,
          rootSolanaAccount.publicKey, // fee payer
          destinationTokenAccountPubkey, // account to create
          destinationPubkey, // owner
          libs.solanaWeb3Manager.mints.usdc // mint
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
    let destinationTokenAccount = destinationAddress
    if (!isTokenAccountAddress) {
      const destinationTokenAccountPubkey = yield* call(
        getAssociatedTokenAddressSync,
        libs.solanaWeb3Manager.mints.usdc,
        destinationPubkey
      )
      destinationTokenAccount = destinationTokenAccountPubkey.toString()
    }
    // Multiply by 10^6 to account for USDC decimals, but also convert from cents to dollars
    const withdrawalAmountWei = new BN(withdrawalAmount)
      .mul(new BN(10 ** TOKEN_LISTING_MAP.USDC.decimals))
      .div(new BN(100))
    const usdcUserBank = yield* call(getUSDCUserBank)
    const transferInstructions = yield* call(
      [
        libs.solanaWeb3Manager,
        libs.solanaWeb3Manager.createTransferInstructionsFromCurrentUser
      ],
      {
        amount: withdrawalAmountWei,
        feePayerKey: feePayerPubkey,
        senderSolanaAddress: usdcUserBank,
        recipientSolanaAddress: destinationTokenAccount,
        mint: 'usdc'
      }
    )
    // Relay the transfer so that the user doesn't need SOL if the account already exists
    const recentBlockhash = yield* call(getRecentBlockhash)
    const {
      res: transferSignature,
      error,
      errorCode
    } = yield* call(
      [transactionHandler, transactionHandler.handleTransaction],
      {
        instructions: transferInstructions,
        feePayerOverride: feePayerPubkey,
        recentBlockhash,
        skipPreflight: true
      }
    )
    if (!transferSignature || error) {
      throw new Error(`Failed to transfer: [${errorCode}] ${error}`)
    }
    console.debug(
      'Withdraw USDC - successfully transferred USDC - tx hash',
      transferSignature
    )
    yield* call(onSuccess, transferSignature)
    yield* put(withdrawUSDCSucceeded())

    // clear the withdrawals so next query will fetch from source
    yield* put(userApiActions.resetGetUSDCTransactions!())
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

function* watchBeginWithdrawUSDC() {
  yield takeLatest(beginWithdrawUSDC, doWithdrawUSDC)
}

export default function sagas() {
  return [watchBeginWithdrawUSDC]
}
