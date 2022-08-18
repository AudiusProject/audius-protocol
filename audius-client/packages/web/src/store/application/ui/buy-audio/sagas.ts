import { Name } from '@audius/common'
import { TransactionHandler } from '@audius/sdk/dist/core'
import { Jupiter, SwapMode, RouteInfo } from '@jup-ag/core'
import { u64 } from '@solana/spl-token'
import {
  Cluster,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction
} from '@solana/web3.js'
import JSBI from 'jsbi'
import { takeLatest } from 'redux-saga/effects'
import {
  call,
  select,
  put,
  takeEvery,
  take,
  race,
  fork
} from 'typed-redux-saga/macro'

import { make } from 'common/store/analytics/actions'
import {
  JupiterTokenSymbol,
  TOKEN_LISTING_MAP
} from 'common/store/buy-audio/constants'
import {
  getBuyAudioFlowStage,
  getFeesCache
} from 'common/store/buy-audio/selectors'
import {
  calculateAudioPurchaseInfo,
  calculateAudioPurchaseInfoSucceeded,
  cacheAssociatedTokenAccount,
  cacheTransactionFees,
  onRampOpened,
  onRampSucceeded,
  onRampCanceled,
  swapCompleted,
  swapStarted,
  transferStarted,
  transferCompleted,
  clearFeesCache
} from 'common/store/buy-audio/slice'
import { increaseBalance } from 'common/store/wallet/slice'
import {
  convertJSBIToAmountObject,
  convertWAudioToWei,
  formatWei,
  weiToString
} from 'common/utils/wallet'
import {
  createTransferToUserBankTransaction,
  getAssociatedTokenAccountInfo,
  getAssociatedTokenRentExemptionMinimum,
  getAudioAccount,
  getAudioAccountInfo,
  getRootSolanaAccount,
  getSolanaConnection,
  pollForAudioBalanceChange,
  pollForSolBalanceChange
} from 'services/audius-backend/BuyAudio'
import {
  createUserBankIfNeeded,
  getUserBank
} from 'services/audius-backend/waudio'

const SOLANA_CLUSTER_ENDPOINT = process.env.REACT_APP_SOLANA_CLUSTER_ENDPOINT
const SOLANA_CLUSTER = process.env.REACT_APP_SOLANA_WEB3_CLUSTER

const ERROR_CODE_INSUFFICIENT_FUNDS = 1 // Error code for when the swap fails due to insufficient funds in the wallet
const ERROR_CODE_SLIPPAGE = 6000 // Error code for when the swap fails due to specified slippage being exceeded
const SLIPPAGE = 3 // The slippage amount to allow for exchanges
const MIN_PADDING = 0.00005 * LAMPORTS_PER_SOL // Buffer for SOL in wallet
let _jup: Jupiter

/**
 * Initializes Jupiter singleton if necessary and returns
 * @returns a Jupiter instance
 */
function* initJupiterIfNecessary() {
  if (!_jup) {
    if (!SOLANA_CLUSTER_ENDPOINT) {
      throw new Error('Solana Cluster Endpoint is not configured')
    }
    const connection = new Connection(SOLANA_CLUSTER_ENDPOINT, 'confirmed')
    const cluster = (SOLANA_CLUSTER ?? 'mainnet-beta') as Cluster
    try {
      _jup = yield* call(Jupiter.load, {
        connection,
        cluster,
        restrictIntermediateTokens: true,
        wrapUnwrapSOL: true,
        routeCacheDuration: 5_000 // 5 seconds
      })
      console.debug('Using', connection.rpcEndpoint, 'for onRamp RPC')
    } catch (e) {
      console.error(
        'Jupiter failed to initialize with RPC',
        connection.rpcEndpoint,
        e
      )
      throw e
    }
  }
  return _jup
}

/**
 * Gets a quote from Jupiter for an exchange from inputTokenSymbol => outputTokenSymbol
 * @returns the best quote including the RouteInfo
 */
function* getQuote({
  inputTokenSymbol,
  outputTokenSymbol,
  inputAmount,
  forceFetch,
  slippage
}: {
  inputTokenSymbol: JupiterTokenSymbol
  outputTokenSymbol: JupiterTokenSymbol
  inputAmount: number
  forceFetch?: boolean
  slippage: number
}) {
  const inputToken = TOKEN_LISTING_MAP[inputTokenSymbol]
  const outputToken = TOKEN_LISTING_MAP[outputTokenSymbol]
  const amount = JSBI.BigInt(Math.ceil(inputAmount * 10 ** inputToken.decimals))
  if (!inputToken || !outputToken) {
    throw new Error(
      `Tokens not found: ${inputTokenSymbol} => ${outputTokenSymbol}`
    )
  }
  const jup = yield* call(initJupiterIfNecessary)
  const routes = yield* call([jup, jup.computeRoutes], {
    inputMint: new PublicKey(inputToken.address),
    outputMint: new PublicKey(outputToken.address),
    amount,
    slippage,
    swapMode: SwapMode.ExactIn,
    forceFetch
  })
  const bestRoute = routes.routesInfos[0]

  const resultQuote = {
    inputAmount: convertJSBIToAmountObject(
      bestRoute.inAmount,
      inputToken.decimals
    ),
    outputAmount: convertJSBIToAmountObject(
      bestRoute.outAmount,
      outputToken.decimals
    ),
    route: bestRoute,
    inputTokenSymbol,
    outputTokenSymbol
  }
  return resultQuote
}

/**
 * Wrapper for TransactionHandler.handleTransaction that does some logging and error checking
 */
async function sendTransaction({
  name,
  transaction,
  feePayer,
  transactionHandler
}: {
  name: string
  transaction: Transaction
  feePayer: Keypair
  transactionHandler: TransactionHandler
}) {
  console.debug(`Exchange: starting ${name} transaction...`)
  const result = await transactionHandler.handleTransaction({
    instructions: transaction.instructions,
    feePayerOverride: feePayer.publicKey,
    skipPreflight: true,
    errorMapping: {
      fromErrorCode: (errorCode) => {
        if (errorCode === ERROR_CODE_SLIPPAGE) {
          return 'Slippage threshold exceeded'
        } else if (errorCode === ERROR_CODE_INSUFFICIENT_FUNDS) {
          return 'Insufficient funds'
        }
        return `Error Code: ${errorCode}`
      }
    }
  })
  if (result.error) {
    console.debug(
      `Exchange: ${name} transaction stringified:`,
      JSON.stringify(transaction)
    )
    throw new Error(`${name} transaction failed: ${result.error}`)
  }
  console.debug(`Exchange: ${name} transaction... success txid: ${result.res}`)
  return result
}

/**
 * Executes a Jupiter Swap given the RouteInfo, account, and the transactionHandler
 */
function* executeSwap({
  route,
  account,
  transactionHandler
}: {
  route: RouteInfo
  account: Keypair
  transactionHandler: TransactionHandler
}) {
  const jup = yield* call(initJupiterIfNecessary)
  const {
    transactions: { setupTransaction, swapTransaction, cleanupTransaction }
  } = yield* call([jup, jup.exchange], {
    routeInfo: route,
    userPublicKey: account.publicKey
  })
  if (setupTransaction) {
    yield* call(sendTransaction, {
      name: 'Setup',
      transaction: setupTransaction,
      feePayer: account,
      transactionHandler
    })
  }
  // Wrap this in try/finally to ensure cleanup transaction runs, if applicable
  try {
    yield* call(sendTransaction, {
      name: 'Swap',
      transaction: swapTransaction,
      feePayer: account,
      transactionHandler
    })
  } finally {
    if (cleanupTransaction) {
      yield* call(sendTransaction, {
        name: 'Cleanup',
        transaction: cleanupTransaction,
        feePayer: account,
        transactionHandler
      })
    }
  }
}

/**
 * Checks if the associated accounts necessary for a quoted `route` exist on `rootAccount`,
 * and for those that don't, estimates the needed lamports to pay for rent exemption as they are created.
 * Uses the redux store to cache the result.
 * @returns the total amount of lamports necessary for all ATA creation rent fees in a swap and transfer
 */
function* getAssociatedAccountCreationFees({
  route,
  rootAccount,
  feesCache
}: {
  route: RouteInfo
  rootAccount: PublicKey
  feesCache: ReturnType<typeof getFeesCache>
}) {
  const mintKeysSet = new Set<PublicKey>()
  for (const marketInfo of route.marketInfos) {
    mintKeysSet.add(marketInfo.inputMint)
    mintKeysSet.add(marketInfo.outputMint)
  }
  const minRentForATA = yield* call(getAssociatedTokenRentExemptionMinimum)
  let accountCreationFees = 0
  for (const mintKey of mintKeysSet.values()) {
    const exists = feesCache?.associatedTokenAccountCache[mintKey.toString()]
    if (exists === false) {
      accountCreationFees += minRentForATA
    } else if (exists === undefined) {
      const accountInfo = yield* call(getAssociatedTokenAccountInfo, {
        rootAccount,
        mintKey
      })
      yield* put(
        cacheAssociatedTokenAccount({
          account: mintKey.toString(),
          exists: accountInfo !== null
        })
      )
      if (accountInfo === null) {
        accountCreationFees += minRentForATA
      }
    }
  }
  return accountCreationFees
}

/**
 * Creates the transactions necessary for a swap and transfer to calculate transaction fees
 * @returns the total amount of lamports necessary for all transaction fees in a swap and transfer
 */
function* getTransactionFees({
  route,
  rootAccount,
  feesCache
}: {
  route: RouteInfo
  rootAccount: PublicKey
  feesCache: ReturnType<typeof getFeesCache>
}) {
  let transactionFees = feesCache?.transactionFees ?? 0
  if (!transactionFees) {
    const jup = yield* call(initJupiterIfNecessary)
    const {
      transactions: { setupTransaction, swapTransaction, cleanupTransaction }
    } = yield* call([jup, jup.exchange], {
      routeInfo: route,
      userPublicKey: rootAccount
    })
    const userBank = yield* call(getUserBank)
    const transferTransaction = yield* call(
      createTransferToUserBankTransaction,
      {
        userBank,
        fromAccount: rootAccount,
        // eslint-disable-next-line new-cap
        amount: new u64(JSBI.toNumber(route.outAmount))
      }
    )
    const connection = yield* call(getSolanaConnection)
    const latestBlockhashResult = yield* call(
      [connection, connection.getLatestBlockhash],
      'finalized'
    )
    const names = ['Setup', 'Swap', 'Cleanup', 'Transfer']
    let i = 0
    for (const transaction of [
      setupTransaction,
      swapTransaction,
      cleanupTransaction,
      transferTransaction
    ]) {
      if (transaction) {
        if (!transaction.recentBlockhash) {
          transaction.recentBlockhash = latestBlockhashResult.blockhash
        }
        if (!transaction.feePayer) {
          transaction.feePayer = rootAccount
        }
        const message = transaction.compileMessage()
        const fees = yield* call(
          [connection, connection.getFeeForMessage],
          message
        )
        console.debug(
          `Fee for "${names[i]}" transaction: ${fees.value} Lamports`
        )
        transactionFees += fees.value
      }
      i++
    }
    yield* put(cacheTransactionFees({ transactionFees }))
  }
  return transactionFees
}

/**
 * Calculates all the fees required for executing a swap and transfer by doing a "dry-run"
 * @returns the transaction fees and ATA creation fees (in lamports)
 */
function* getSwapFees({ route }: { route: RouteInfo }) {
  const feesCache = yield* select(getFeesCache)
  const rootAccount = yield* call(getRootSolanaAccount)
  const associatedAccountCreationFees = yield* call(
    getAssociatedAccountCreationFees,
    { rootAccount: rootAccount.publicKey, route, feesCache }
  )

  const transactionFees = yield* call(getTransactionFees, {
    rootAccount: rootAccount.publicKey,
    route,
    feesCache
  })
  console.debug(
    `Estimated transaction fees: ${
      transactionFees / LAMPORTS_PER_SOL
    } SOL. Estimated associated account creation fees: ${
      associatedAccountCreationFees / LAMPORTS_PER_SOL
    } SOL. Total estimated fees: ${
      (associatedAccountCreationFees + transactionFees) / LAMPORTS_PER_SOL
    }`
  )
  return { transactionFees, associatedAccountCreationFees }
}

function* getAudioPurchaseInfo({
  payload: { audioAmount }
}: ReturnType<typeof calculateAudioPurchaseInfo>) {
  try {
    // Ensure userbank is created
    yield* fork(function* () {
      yield* call(createUserBankIfNeeded)
    })

    // Setup
    const connection = yield* call(getSolanaConnection)
    const rootAccount = yield* call(getRootSolanaAccount)

    const slippage = SLIPPAGE

    // Get AUDIO => SOL quote
    const reverseQuote = yield* call(getQuote, {
      inputTokenSymbol: 'AUDIO',
      outputTokenSymbol: 'SOL',
      inputAmount: audioAmount,
      slippage
    })
    const slippageFactor = 100.0 / (100.0 - slippage)

    // Adjust quote for potential slippage
    const inSol = Math.ceil(reverseQuote.outputAmount.amount * slippageFactor)

    // Get SOL => AUDIO quote to calculate fees
    const quote = yield* call(getQuote, {
      inputTokenSymbol: 'SOL',
      outputTokenSymbol: 'AUDIO',
      inputAmount: inSol,
      slippage
    })
    const { associatedAccountCreationFees, transactionFees } = yield* call(
      getSwapFees,
      { route: quote.route }
    )

    // Get existing solana balance
    const existingBalance = yield* call(
      [connection, connection.getBalance],
      rootAccount.publicKey,
      'finalized'
    )

    const estimatedLamports =
      inSol +
      associatedAccountCreationFees +
      transactionFees +
      MIN_PADDING -
      existingBalance

    // Get SOL => USDC quote to estimate $USD cost
    const quoteUSD = yield* call(getQuote, {
      inputTokenSymbol: 'SOL',
      outputTokenSymbol: 'USDC',
      inputAmount: estimatedLamports / LAMPORTS_PER_SOL,
      slippage: 0
    })

    console.debug(
      `Quoted: ${reverseQuote.outputAmount.uiAmountString} SOL
Adjustment For Slippage (${slippage}%): ${
        (inSol - reverseQuote.outputAmount.amount) / LAMPORTS_PER_SOL
      } SOL
Fees: ${
        (associatedAccountCreationFees + transactionFees) / LAMPORTS_PER_SOL
      } SOL
Existing Balance: ${existingBalance / LAMPORTS_PER_SOL} SOL
Total: ${estimatedLamports / LAMPORTS_PER_SOL} SOL ($${
        quoteUSD.outputAmount.uiAmountString
      } USDC)`
    )

    yield* put(
      calculateAudioPurchaseInfoSucceeded({
        estimatedSOL: convertJSBIToAmountObject(
          JSBI.BigInt(estimatedLamports),
          TOKEN_LISTING_MAP.SOL.decimals
        ),
        estimatedUSD: quoteUSD.outputAmount,
        desiredAudioAmount: convertJSBIToAmountObject(
          JSBI.BigInt(
            Math.ceil(audioAmount * 10 ** TOKEN_LISTING_MAP.AUDIO.decimals)
          ),
          TOKEN_LISTING_MAP.AUDIO.decimals
        )
      })
    )
  } catch (e) {
    console.error('Failed to get AUDIO purchase info:', e)
  }
}

/**
 * Exchanges all but the minimum balance required for a swap from a wallet once a balance change is seen
 */
function* startBuyAudioFlow({
  payload: { desiredAudioAmount, estimatedSOL }
}: ReturnType<typeof onRampOpened>) {
  try {
    // Record start
    yield* put(
      make(Name.BUY_AUDIO_ON_RAMP_OPENED, {
        provider: 'coinbase'
      })
    )

    // Setup
    const rootAccount: Keypair = yield* call(getRootSolanaAccount)
    const connection = yield* call(getSolanaConnection)
    const transactionHandler = new TransactionHandler({
      connection,
      useRelay: false,
      feePayerKeypairs: [rootAccount],
      skipPreflight: true
    })

    // Ensure userbank is created
    yield* fork(function* () {
      yield* call(createUserBankIfNeeded)
    })

    // Cache current SOL balance
    const initialBalance = yield* call(
      [connection, connection.getBalance],
      rootAccount.publicKey,
      'finalized'
    )

    // Wait for on ramp finish
    const result = yield* race({
      success: take(onRampSucceeded),
      canceled: take(onRampCanceled)
    })

    // If the user didn't complete the on ramp flow, return early
    if (result.canceled) {
      yield* put(
        make(Name.BUY_AUDIO_ON_RAMP_CANCELED, { provider: 'coinbase' })
      )
      return
    }
    yield* put(make(Name.BUY_AUDIO_ON_RAMP_SUCCESS, { provider: 'coinbase' }))

    // Wait for the SOL funds to come through
    const newBalance = yield* call(pollForSolBalanceChange, {
      rootAccount: rootAccount.publicKey,
      initialBalance
    })

    // Check that we got the requested SOL
    if (newBalance - initialBalance !== estimatedSOL.amount) {
      console.warn(
        `Warning: Purchase SOL amount differs from expected. Actual: ${
          (newBalance - initialBalance) / LAMPORTS_PER_SOL
        } SOL. Expected: ${estimatedSOL.uiAmountString} SOL.`
      )
    }

    // Get dummy quote and calculate fees
    let quote = yield* call(getQuote, {
      inputTokenSymbol: 'SOL',
      outputTokenSymbol: 'AUDIO',
      inputAmount: newBalance / LAMPORTS_PER_SOL,
      slippage: SLIPPAGE
    })
    const { associatedAccountCreationFees, transactionFees } = yield* call(
      getSwapFees,
      { route: quote.route }
    )
    const minSol = associatedAccountCreationFees + transactionFees + MIN_PADDING
    const inputAmount = (newBalance - minSol) / LAMPORTS_PER_SOL
    console.debug(`Exchanging ${inputAmount} SOL to AUDIO`)

    // Get new quote adjusted for fees
    quote = yield* call(getQuote, {
      inputTokenSymbol: 'SOL',
      outputTokenSymbol: 'AUDIO',
      inputAmount,
      slippage: SLIPPAGE
    })

    // Check that we get the desired AUDIO from the quote
    const audioAdjusted = convertJSBIToAmountObject(
      JSBI.BigInt(
        Math.floor(
          (JSBI.toNumber(quote.route.outAmount) * (100 - SLIPPAGE)) / 100.0
        )
      ),
      TOKEN_LISTING_MAP.AUDIO.decimals
    )
    if (audioAdjusted.amount < desiredAudioAmount.amount) {
      console.warn(
        `Warning: Purchase AUDIO amount may be lower than expected. Actual min: ${audioAdjusted.uiAmountString} AUDIO. Expected min: ${desiredAudioAmount.uiAmountString} AUDIO`
      )
    }

    // Cache the AUDIO balance before swapping
    const tokenAccount = yield* call(getAudioAccount, {
      rootAccount: rootAccount.publicKey
    })
    const beforeSwapAudioAccountInfo = yield* call(getAudioAccountInfo, {
      tokenAccount
    })
    const beforeSwapAudioBalance =
      // eslint-disable-next-line new-cap
      beforeSwapAudioAccountInfo?.amount ?? new u64(0)

    // Swap the SOL for AUDIO
    yield* put(swapStarted())
    yield* call(executeSwap, {
      route: quote.route,
      account: rootAccount,
      transactionHandler
    })
    yield* put(swapCompleted())

    // Reset associated token account cache now that the swap created the accounts
    // (can't simply set all the accounts in the route to "exists" because wSOL gets closed)
    yield* put(clearFeesCache())

    // Wait for AUDIO funds to come through
    const transferAmount = yield* call(pollForAudioBalanceChange, {
      tokenAccount,
      initialBalance: beforeSwapAudioBalance
    })

    // Transfer AUDIO to userbank
    const userBank = yield* call(getUserBank)
    yield* put(transferStarted())
    const transferTransaction = yield* call(
      createTransferToUserBankTransaction,
      {
        userBank,
        fromAccount: rootAccount.publicKey,
        amount: transferAmount
      }
    )
    yield* call(sendTransaction, {
      name: 'Transfer',
      transaction: transferTransaction,
      feePayer: rootAccount,
      transactionHandler
    })
    yield* put(transferCompleted())

    // Update wallet balance optimistically
    const outputAmount = convertWAudioToWei(transferAmount)
    yield* put(
      increaseBalance({
        amount: weiToString(outputAmount)
      })
    )

    // Record success
    yield* put(
      make(Name.BUY_AUDIO_SUCCESS, {
        provider: 'coinbase',
        requestedAudio: desiredAudioAmount.uiAmount,
        actualAudio: parseFloat(formatWei(outputAmount).replaceAll(',', '')),
        surplusAudio: parseFloat(
          formatWei(
            convertWAudioToWei(
              // eslint-disable-next-line new-cap
              transferAmount.sub(new u64(desiredAudioAmount.amount))
            )
          ).replaceAll(',', '')
        )
      })
    )
  } catch (e) {
    const stage = yield* select(getBuyAudioFlowStage)
    console.error('BuyAudio failed at stage', stage, 'with error:', e)
    yield* put(
      make(Name.BUY_AUDIO_FAILURE, {
        provider: 'coinbase',
        stage,
        requestedAudio: desiredAudioAmount.uiAmount,
        error: (e as Error).message
      })
    )
  }
}

function* watchCalculateAudioPurchaseInfo() {
  yield takeLatest(calculateAudioPurchaseInfo, getAudioPurchaseInfo)
}

function* watchOnRampStarted() {
  yield* takeEvery(onRampOpened, startBuyAudioFlow)
}

export default function sagas() {
  return [watchOnRampStarted, watchCalculateAudioPurchaseInfo]
}
