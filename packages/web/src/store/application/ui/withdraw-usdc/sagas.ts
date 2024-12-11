import {
  Name,
  Status,
  WithdrawUSDCTransferEventFields
} from '@audius/common/models'
import { transferFromUserBank } from '@audius/common/src/services/audius-backend/solana'
import {
  withdrawUSDCActions,
  WithdrawUSDCModalPages,
  withdrawUSDCModalActions,
  WithdrawMethod,
  getContext,
  buyUSDCActions,
  accountSelectors,
  getSDK
} from '@audius/common/store'
import { PublicKey } from '@solana/web3.js'
import { takeLatest } from 'redux-saga/effects'
import { call, put, race, select, take } from 'typed-redux-saga'

import { env } from 'services/env'
import {
  getRootSolanaAccount,
  getSolanaConnection
} from 'services/solana/solana'

const {
  beginWithdrawUSDC,
  beginCoinflowWithdrawal,
  coinflowWithdrawalReady,
  coinflowWithdrawalCanceled,
  coinflowWithdrawalSucceeded,
  withdrawUSDCFailed,
  withdrawUSDCSucceeded,
  cleanup: cleanupWithdrawUSDC,
  updateAmount
} = withdrawUSDCActions
const { set: setWithdrawUSDCModalData, close: closeWithdrawUSDCModal } =
  withdrawUSDCModalActions

function* doWithdrawUSDCCoinflow({
  amount,
  currentBalance,
  privateKey
}: Pick<
  ReturnType<typeof beginWithdrawUSDC>['payload'],
  'amount' | 'currentBalance' | 'privateKey'
>) {
  const { track, make } = yield* getContext('analytics')
  const sdk = yield* getSDK()
  yield* put(beginCoinflowWithdrawal())
  const mint = new PublicKey(env.USDC_MINT_ADDRESS)

  const analyticsFields: WithdrawUSDCTransferEventFields = {
    destinationAddress: 'COINFLOW',
    amount: amount / 100,
    // Incoming balance is in cents, analytics values are in dollars
    currentBalance: currentBalance / 100
  }
  try {
    yield* call(
      track,
      make({
        eventName: Name.WITHDRAW_USDC_REQUESTED,
        ...analyticsFields
      })
    )

    const rootSolanaAccount = yield* call(getRootSolanaAccount)

    const destinationAddress = rootSolanaAccount.publicKey.toString()
    const connection = yield* call(getSolanaConnection)

    const user = yield* select(accountSelectors.getAccountUser)
    if (!user?.wallet) {
      throw new Error('Unable to find wallet. Is the user signed in?')
    }
    const ethWallet = user.wallet
    const destinationWallet = new PublicKey(destinationAddress)

    const signature = yield* call(transferFromUserBank, {
      sdk,
      mint,
      connection,
      amount: amount / 100, // amount is given in cents, fn expects dollars
      ethWallet,
      destinationWallet,
      track,
      make,
      analyticsFields,
      signer: rootSolanaAccount
    })

    console.debug(
      'Withdraw USDC - successfully transferred USDC to root wallet for withdrawal.',
      {
        signature
      }
    )

    yield* call(
      track,
      make({
        eventName: Name.WITHDRAW_USDC_TRANSFER_TO_ROOT_WALLET,
        ...analyticsFields
      })
    )

    // Finalizes the transaction for our connection
    yield* call(
      [connection, connection.confirmTransaction],
      signature,
      'finalized'
    )

    yield* put(updateAmount({ amount }))

    yield* call(
      track,
      make({
        eventName: Name.WITHDRAW_USDC_COINFLOW_WITHDRAWAL_READY,
        ...analyticsFields
      })
    )

    yield* put(coinflowWithdrawalReady())
    const result = yield* race({
      succeeded: take(coinflowWithdrawalSucceeded),
      canceled: take(coinflowWithdrawalCanceled)
    })

    if (result.succeeded) {
      yield* put(
        withdrawUSDCSucceeded({
          transaction: result.succeeded.payload.transaction
        })
      )
      yield* put(
        setWithdrawUSDCModalData({
          page: WithdrawUSDCModalPages.TRANSFER_SUCCESSFUL
        })
      )
      yield* call(
        track,
        make({ eventName: Name.WITHDRAW_USDC_SUCCESS, ...analyticsFields })
      )
    } else {
      yield* call(
        track,
        make({
          eventName: Name.WITHDRAW_USDC_CANCELLED,
          ...analyticsFields
        })
      )
      yield* put(buyUSDCActions.startRecoveryIfNecessary({ privateKey }))
      // Wait for the recovery to succeed or error
      const action = yield* take<
        ReturnType<typeof buyUSDCActions.recoveryStatusChanged>
      >((action: any) => {
        return (
          action.type === buyUSDCActions.recoveryStatusChanged.type &&
          (action?.payload?.status === Status.SUCCESS ||
            action?.payload.status === Status.ERROR)
        )
      })
      yield* put(cleanupWithdrawUSDC())
      yield* put(closeWithdrawUSDCModal())
      // Buy USDC recovery already logs to sentry and makes an analytics event
      // so add some logs to help discern which flow the recovery was triggered
      // from and help aid in debugging should this ever hit.
      if (action.payload.status === Status.ERROR) {
        // Breadcrumb hint:
        console.warn(
          'Failed to transfer funds back from root wallet:',
          rootSolanaAccount.publicKey.toBase58()
        )
        // Console error for sentry issue
        console.error('Failed to recover funds from Coinflow Withdraw')
      }
    }
  } catch (e: unknown) {
    console.error('Withdraw USDC failed', e)
    const reportToSentry = yield* getContext('reportToSentry')
    yield* put(withdrawUSDCFailed({ error: e as Error }))

    yield* call(
      track,
      make({
        eventName: Name.WITHDRAW_USDC_FAILURE,
        ...analyticsFields,
        error: e instanceof Error ? e.message : e
      })
    )

    reportToSentry({
      error: e as Error
    })
  }
}

function* doWithdrawUSDCManualTransfer({
  amount,
  currentBalance,
  destinationAddress
}: Pick<
  ReturnType<typeof beginWithdrawUSDC>['payload'],
  'amount' | 'currentBalance' | 'destinationAddress'
>) {
  const { track, make } = yield* getContext('analytics')
  const withdrawalAmountDollars = amount / 100
  const mint = new PublicKey(env.USDC_MINT_ADDRESS)
  const sdk = yield* getSDK()
  const connection = yield* call(getSolanaConnection)

  const analyticsFields: WithdrawUSDCTransferEventFields = {
    destinationAddress,
    amount: withdrawalAmountDollars,
    // Incoming balance is in cents, analytics values are in dollars
    currentBalance: currentBalance / 100
  }
  try {
    yield* call(
      track,
      make({
        eventName: Name.WITHDRAW_USDC_REQUESTED,
        ...analyticsFields
      })
    )

    const user = yield* select(accountSelectors.getAccountUser)
    if (!user?.wallet) {
      throw new Error('Unable to find wallet. Is the user signed in?')
    }
    const ethWallet = user.wallet
    const destinationWallet = new PublicKey(destinationAddress)

    const signature = yield* call(transferFromUserBank, {
      connection,
      sdk,
      mint,
      amount: amount / 100, // amount is in cents, fn expects dollars
      ethWallet,
      destinationWallet,
      track,
      make,
      analyticsFields
    })

    console.debug('Withdraw USDC - successfully transferred USDC.', {
      signature
    })

    yield* put(withdrawUSDCSucceeded({ transaction: signature }))
    yield* put(
      setWithdrawUSDCModalData({
        page: WithdrawUSDCModalPages.TRANSFER_SUCCESSFUL
      })
    )
    yield* call(
      track,
      make({ eventName: Name.WITHDRAW_USDC_SUCCESS, ...analyticsFields })
    )
  } catch (e: unknown) {
    console.error('Withdraw USDC failed', e)
    const reportToSentry = yield* getContext('reportToSentry')
    yield* put(withdrawUSDCFailed({ error: e as Error }))

    yield* call(
      track,
      make({
        eventName: Name.WITHDRAW_USDC_FAILURE,
        ...analyticsFields,
        error: e instanceof Error ? e.message : e
      })
    )

    reportToSentry({
      error: e as Error
    })
  }
}

/**
 * Handles all logic for withdrawing USDC to a given destination. Expects amount in cents.
 */
function* doWithdrawUSDC({
  payload: { amount, method, currentBalance, destinationAddress, privateKey }
}: ReturnType<typeof beginWithdrawUSDC>) {
  switch (method) {
    case WithdrawMethod.COINFLOW:
      yield* call(doWithdrawUSDCCoinflow, {
        amount,
        currentBalance,
        privateKey
      })
      break
    case WithdrawMethod.MANUAL_TRANSFER:
      yield* call(doWithdrawUSDCManualTransfer, {
        amount,
        currentBalance,
        destinationAddress
      })
      break
  }
}

function* watchBeginWithdrawUSDC() {
  yield takeLatest(beginWithdrawUSDC, doWithdrawUSDC)
}

export default function sagas() {
  return [watchBeginWithdrawUSDC]
}
