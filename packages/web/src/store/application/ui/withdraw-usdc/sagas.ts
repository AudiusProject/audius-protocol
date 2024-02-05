import {
  withdrawUSDCActions,
  MEMO_PROGRAM_ID,
  PREPARE_WITHDRAWAL_MEMO_STRING,
  solanaSelectors,
  ErrorLevel,
  SolanaWalletAddress,
  getUSDCUserBank,
  TOKEN_LISTING_MAP,
  getUserbankAccountInfo,
  BNUSDC,
  relayVersionedTransaction,
  relayTransaction,
  formatUSDCWeiToFloorCentsNumber,
  Name,
  WithdrawUSDCTransferEventFields,
  withdrawUSDCModalActions,
  WithdrawUSDCModalPages,
  WithdrawMethod,
  getContext,
  buyUSDCActions,
  Status
} from '@audius/common'
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction
} from '@solana/web3.js'
import BN from 'bn.js'
import { takeLatest } from 'redux-saga/effects'
import { call, put, race, select, take } from 'typed-redux-saga'

import { getLibs } from 'services/audius-libs'
import {
  createSwapUserbankToSolInstructions,
  createVersionedTransaction,
  getFundDestinationTokenAccountFees
} from 'services/solana/WithdrawUSDC'
import {
  isTokenAccount,
  getTokenAccountInfo,
  getRootSolanaAccount,
  ROOT_ACCOUNT_SIZE
} from 'services/solana/solana'

const {
  beginWithdrawUSDC,
  beginCoinflowWithdrawal,
  coinflowWithdrawalReady,
  coinflowWithdrawalCanceled,
  coinflowWithdrawalSucceeded,
  withdrawUSDCFailed,
  withdrawUSDCSucceeded,
  cleanup: cleanupWithdrawUSDC
} = withdrawUSDCActions
const { set: setWithdrawUSDCModalData, close: closeWithdrawUSDCModal } =
  withdrawUSDCModalActions
const { getFeePayer } = solanaSelectors

/**
 * Swaps some of the USDC in the user's bank account for SOL and sends it to their root Solana wallet
 */
function* swapUSDCToSol({
  amount,
  feePayer
}: {
  amount: number
  feePayer: PublicKey
}) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const rootSolanaAccount = yield* call(getRootSolanaAccount)
  const { instructions, lookupTableAddresses } = yield* call(
    createSwapUserbankToSolInstructions,
    {
      mint: 'usdc',
      wallet: rootSolanaAccount.publicKey,
      outSolAmount: amount,
      feePayer
    }
  )
  const { transaction, lookupTableAccounts } = yield* call(
    createVersionedTransaction,
    {
      instructions,
      lookupTableAddresses,
      feePayer
    }
  )
  transaction.sign([rootSolanaAccount])
  const { res: transactionSignature, error: swapError } = yield* call(
    relayVersionedTransaction,
    audiusBackendInstance,
    {
      transaction,
      addressLookupTableAccounts: lookupTableAccounts,
      skipPreflight: true
    }
  )
  if (swapError) {
    throw new Error(`Swap transaction failed: ${swapError}`)
  }
  console.debug('Withdraw USDC - root wallet funded via swap.', {
    transactionSignature
  })
}

/**
 * Creates an associated token account for USDC on the destination wallet using the user's root wallet.
 * Funds root wallet as necessary by swapping USDC for SOL.
 */
function* createDestinationTokenAccount({
  destinationWallet,
  destinationTokenAccount,
  feePayer
}: {
  destinationWallet: PublicKey
  destinationTokenAccount: PublicKey
  feePayer: PublicKey
}) {
  // Setup
  const libs = yield* call(getLibs)
  const rootSolanaAccount = yield* call(getRootSolanaAccount)
  if (!libs.solanaWeb3Manager) {
    throw new Error('Failed to get solana web3 manager')
  }
  const connection = libs.solanaWeb3Manager.connection

  // Check if there is enough SOL to fund the destination associated token account
  const feeAmount = yield* call(
    getFundDestinationTokenAccountFees,
    destinationTokenAccount
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

  const solRequired = feeAmount + rootSolanaAccountRent - existingBalance
  if (solRequired > 0) {
    // Swap USDC for SOL to fund the destination associated token account
    console.debug(
      'Withdraw USDC - not enough SOL to fund destination account, attempting to swap USDC for SOL...',
      { solRequired, feeAmount, existingBalance, rootSolanaAccountRent }
    )
    yield* call(swapUSDCToSol, { amount: solRequired, feePayer })
  }

  // Then create and fund the destination associated token account
  const { blockhash, lastValidBlockHeight } = yield* call([
    connection,
    connection.getLatestBlockhash
  ])
  const tx = new Transaction({ blockhash, lastValidBlockHeight })
  const createTokenAccountInstruction = yield* call(
    createAssociatedTokenAccountInstruction,
    rootSolanaAccount.publicKey, // fee payer
    destinationTokenAccount, // account to create
    destinationWallet, // owner
    libs.solanaWeb3Manager.mints.usdc // mint
  )
  tx.add(createTokenAccountInstruction)
  console.debug(
    'Withdraw USDC - Creating destination associated token account...',
    {
      account: destinationTokenAccount.toBase58(),
      wallet: destinationWallet.toBase58()
    }
  )
  const transactionSignature = yield* call(
    sendAndConfirmTransaction,
    connection,
    tx,
    [rootSolanaAccount],
    { skipPreflight: true }
  )
  console.debug(
    'Withdraw USDC - Successfully created destination associated token account.',
    { transactionSignature }
  )
}

function* doWithdrawUSDCCoinflow({
  amount,
  currentBalance
}: Pick<
  ReturnType<typeof beginWithdrawUSDC>['payload'],
  'amount' | 'currentBalance'
>) {
  const { track, make } = yield* getContext('analytics')
  yield* put(beginCoinflowWithdrawal())

  const analyticsFields: WithdrawUSDCTransferEventFields = {
    destinationAddress: 'COINFLOW',
    amount: amount / 100,
    // Incoming balance is in cents, analytics values are in dollars
    currentBalance: currentBalance / 100
  }
  try {
    const audiusBackendInstance = yield* getContext('audiusBackendInstance')

    yield* call(
      track,
      make({
        eventName: Name.WITHDRAW_USDC_REQUESTED,
        ...analyticsFields
      })
    )

    const libs = yield* call(getLibs)
    if (!libs.solanaWeb3Manager) {
      throw new Error('Failed to get solana web3 manager')
    }
    const rootSolanaAccount = yield* call(getRootSolanaAccount)

    const destinationAddress = rootSolanaAccount.publicKey.toString()

    if (!destinationAddress || !amount) {
      throw new Error('Please enter a valid destination address and amount')
    }

    let withdrawalAmount = amount
    const feePayer = yield* select(getFeePayer)
    if (feePayer === null) {
      throw new Error('Missing Fee Payer.')
    }
    const feePayerPubkey = new PublicKey(feePayer)
    const connection = libs.solanaWeb3Manager.connection

    const destinationPubkey = new PublicKey(destinationAddress)
    let destinationTokenAccountAddress: string

    // Check to see if the address is already an associated token account
    const isTokenAccountAddress = yield* call(isTokenAccount, {
      accountAddress: destinationAddress as SolanaWalletAddress,
      mint: 'usdc'
    })

    if (isTokenAccountAddress) {
      // If the destination is already a token account, we can transfer directly
      destinationTokenAccountAddress = destinationAddress
    } else {
      // If it's not, derive the associated token account
      const destinationWallet = destinationPubkey
      const destinationTokenAccount = yield* call(
        getAssociatedTokenAddressSync,
        libs.solanaWeb3Manager.mints.usdc,
        destinationWallet
      )
      destinationTokenAccountAddress = destinationTokenAccount.toBase58()

      // Ensure the derived token account exists
      const tokenAccountInfo = yield* call(getTokenAccountInfo, {
        tokenAccount: destinationTokenAccount,
        mint: 'usdc'
      })

      // If not, then create an associated token account
      if (tokenAccountInfo === null) {
        console.debug(
          'Withdraw USDC - destination associated token account does not exist. Creating...'
        )
        yield* call(createDestinationTokenAccount, {
          destinationWallet,
          destinationTokenAccount,
          feePayer: feePayerPubkey
        })

        // At this point, we likely have swapped some USDC for SOL. Make sure that we are able
        // to still withdraw the amount we specified, and if not, withdraw as much as we can.
        const audiusBackendInstance = yield* getContext('audiusBackendInstance')
        const accountInfo = yield* call(
          getUserbankAccountInfo,
          audiusBackendInstance,
          { mint: 'usdc' }
        )
        const latestBalance = accountInfo?.amount ?? BigInt('0')
        withdrawalAmount = Math.min(
          withdrawalAmount,
          formatUSDCWeiToFloorCentsNumber(
            new BN(latestBalance.toString()) as BNUSDC
          )
        )
      }
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
        recipientSolanaAddress: destinationTokenAccountAddress,
        mint: 'usdc'
      }
    )

    const memoInstruction = new TransactionInstruction({
      keys: [
        {
          pubkey: rootSolanaAccount.publicKey,
          isSigner: true,
          isWritable: true
        }
      ],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(PREPARE_WITHDRAWAL_MEMO_STRING)
    })

    // Relay the withdrawal transfer so that the user doesn't need SOL if the account already exists
    const { blockhash, lastValidBlockHeight } = yield* call([
      connection,
      connection.getLatestBlockhash
    ])
    const transferTransaction = new Transaction({
      blockhash,
      lastValidBlockHeight,
      feePayer: feePayerPubkey
    })

    transferTransaction.add(...transferInstructions, memoInstruction)
    transferTransaction.partialSign(rootSolanaAccount)

    const {
      res: transactionSignature,
      error,
      errorCode
    } = yield* call(relayTransaction, audiusBackendInstance, {
      transaction: transferTransaction,
      skipPreflight: true
    })

    if (!transactionSignature || error) {
      throw new Error(`Failed to transfer: [${errorCode}] ${error}`)
    }
    console.debug('Withdraw USDC - successfully transferred USDC.', {
      transactionSignature
    })
    yield* call(
      [libs.solanaWeb3Manager.connection, 'confirmTransaction'],
      transactionSignature,
      'finalized'
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
      yield* put(buyUSDCActions.startRecoveryIfNecessary())
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
    const error = e as Error
    console.error('Withdraw USDC failed', e)
    const reportToSentry = yield* getContext('reportToSentry')
    yield* put(withdrawUSDCFailed({ error: e as Error }))

    yield* call(
      track,
      make({ eventName: Name.WITHDRAW_USDC_FAILURE, ...analyticsFields, error })
    )

    reportToSentry({
      level: ErrorLevel.Error,
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
  const analyticsFields: WithdrawUSDCTransferEventFields = {
    destinationAddress,
    amount: amount / 100,
    // Incoming balance is in cents, analytics values are in dollars
    currentBalance: currentBalance / 100
  }
  try {
    const audiusBackendInstance = yield* getContext('audiusBackendInstance')

    yield* call(
      track,
      make({
        eventName: Name.WITHDRAW_USDC_REQUESTED,
        ...analyticsFields
      })
    )

    const libs = yield* call(getLibs)
    if (!libs.solanaWeb3Manager) {
      throw new Error('Failed to get solana web3 manager')
    }
    if (!destinationAddress || !amount) {
      throw new Error('Please enter a valid destination address and amount')
    }

    let withdrawalAmount = amount
    const feePayer = yield* select(getFeePayer)
    if (feePayer === null) {
      throw new Error('Missing Fee Payer.')
    }
    const feePayerPubkey = new PublicKey(feePayer)
    const connection = libs.solanaWeb3Manager.connection

    const destinationPubkey = new PublicKey(destinationAddress)
    let destinationTokenAccountAddress: string

    // Check to see if the address is already an associated token account
    const isTokenAccountAddress = yield* call(isTokenAccount, {
      accountAddress: destinationAddress as SolanaWalletAddress,
      mint: 'usdc'
    })

    if (isTokenAccountAddress) {
      // If the destination is already a token account, we can transfer directly
      destinationTokenAccountAddress = destinationAddress
    } else {
      // If it's not, derive the associated token account
      const destinationWallet = destinationPubkey
      const destinationTokenAccount = yield* call(
        getAssociatedTokenAddressSync,
        libs.solanaWeb3Manager.mints.usdc,
        destinationWallet
      )
      destinationTokenAccountAddress = destinationTokenAccount.toBase58()

      // Ensure the derived token account exists
      const tokenAccountInfo = yield* call(getTokenAccountInfo, {
        tokenAccount: destinationTokenAccount,
        mint: 'usdc'
      })

      // If not, then create an associated token account
      if (tokenAccountInfo === null) {
        console.debug(
          'Withdraw USDC - destination associated token account does not exist. Creating...'
        )
        yield* call(createDestinationTokenAccount, {
          destinationWallet,
          destinationTokenAccount,
          feePayer: feePayerPubkey
        })

        // At this point, we likely have swapped some USDC for SOL. Make sure that we are able
        // to still withdraw the amount we specified, and if not, withdraw as much as we can.
        const audiusBackendInstance = yield* getContext('audiusBackendInstance')
        const accountInfo = yield* call(
          getUserbankAccountInfo,
          audiusBackendInstance,
          { mint: 'usdc' }
        )
        const latestBalance = accountInfo?.amount ?? BigInt('0')
        withdrawalAmount = Math.min(
          withdrawalAmount,
          formatUSDCWeiToFloorCentsNumber(
            new BN(latestBalance.toString()) as BNUSDC
          )
        )
      }
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
        recipientSolanaAddress: destinationTokenAccountAddress,
        mint: 'usdc'
      }
    )

    // Relay the withdrawal transfer so that the user doesn't need SOL if the account already exists
    const { blockhash, lastValidBlockHeight } = yield* call([
      connection,
      connection.getLatestBlockhash
    ])
    const transferTransaction = new Transaction({
      blockhash,
      lastValidBlockHeight,
      feePayer: feePayerPubkey
    })
    transferTransaction.add(...transferInstructions)
    const {
      res: transactionSignature,
      error,
      errorCode
    } = yield* call(relayTransaction, audiusBackendInstance, {
      transaction: transferTransaction,
      skipPreflight: true
    })

    if (!transactionSignature || error) {
      throw new Error(`Failed to transfer: [${errorCode}] ${error}`)
    }
    console.debug('Withdraw USDC - successfully transferred USDC.', {
      transactionSignature
    })
    yield* put(withdrawUSDCSucceeded({ transaction: transactionSignature }))
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
    const error = e as Error
    console.error('Withdraw USDC failed', e)
    const reportToSentry = yield* getContext('reportToSentry')
    yield* put(withdrawUSDCFailed({ error: e as Error }))

    yield* call(
      track,
      make({ eventName: Name.WITHDRAW_USDC_FAILURE, ...analyticsFields, error })
    )

    reportToSentry({
      level: ErrorLevel.Error,
      error: e as Error
    })
  }
}

/**
 * Handles all logic for withdrawing USDC to a given destination. Expects amount in cents.
 */
function* doWithdrawUSDC({
  payload: { amount, method, currentBalance, destinationAddress }
}: ReturnType<typeof beginWithdrawUSDC>) {
  switch (method) {
    case WithdrawMethod.COINFLOW:
      yield* call(doWithdrawUSDCCoinflow, { amount, currentBalance })
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
