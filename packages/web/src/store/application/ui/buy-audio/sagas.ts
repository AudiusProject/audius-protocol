import {
  getContext,
  walletActions,
  TOKEN_LISTING_MAP,
  buyAudioSelectors,
  PurchaseInfoErrorType,
  buyAudioActions,
  OnRampProvider,
  transactionDetailsActions,
  TransactionMetadataType,
  TransactionType,
  TransactionMethod,
  TransactionDetails,
  walletSelectors,
  modalsActions,
  AmountObject,
  solanaSelectors
} from '@audius/common'
import { Name, ErrorLevel, BNWei } from '@audius/common/models'
import {
  IntKeys,
  FeatureFlags,
  deriveUserBankPubkey,
  createUserBankIfNeeded,
  LocalStorage
} from '@audius/common/services'
import {
  dayjs,
  isNullOrUndefined,
  weiToString,
  formatWei,
  convertBigIntToAmountObject,
  convertWAudioToWei,
  convertWeiToWAudio
} from '@audius/common/utils'
/* eslint-disable new-cap */
import { TransactionHandler } from '@audius/sdk/dist/core'
import { QuoteResponse } from '@jup-ag/api'
import {
  AddressLookupTableAccount,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionMessage
} from '@solana/web3.js'
import BN from 'bn.js'
import { takeLatest, takeLeading } from 'redux-saga/effects'
import { call, select, put, take, race, fork } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { isMobileWeb } from 'common/utils/isMobileWeb'
import { track } from 'services/analytics'
import {
  createTransferToUserBankTransaction,
  getAssociatedTokenRentExemptionMinimum,
  getAudioAccount,
  getAudioAccountInfo,
  getUserBankTransactionMetadata,
  pollForAudioBalanceChange,
  pollForNewTransaction,
  pollForSolBalanceChange,
  saveUserBankTransactionMetadata,
  getAssociatedTokenAccountInfo
} from 'services/audius-backend/BuyAudio'
import { JupiterSingleton } from 'services/audius-backend/Jupiter'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import {
  TRANSACTION_FEE_FALLBACK,
  getRootAccountRentExemptionMinimum,
  getRootSolanaAccount,
  getSolanaConnection,
  getTransferTransactionFee
} from 'services/solana/solana'
import { reportToSentry } from 'store/errors/reportToSentry'
import { waitForWrite } from 'utils/sagaHelpers'

const { getFeePayer } = solanaSelectors

const {
  calculateAudioPurchaseInfo,
  calculateAudioPurchaseInfoSucceeded,
  cacheAssociatedTokenAccount,
  cacheTransactionFees,
  startBuyAudioFlow,
  onrampOpened,
  onrampSucceeded,
  onrampCanceled,
  swapCompleted,
  swapStarted,
  transferStarted,
  transferCompleted,
  clearFeesCache,
  calculateAudioPurchaseInfoFailed,
  buyAudioFlowFailed,
  startRecoveryIfNecessary
} = buyAudioActions

const { setVisibility } = modalsActions

const { getBuyAudioFlowStage, getFeesCache, getBuyAudioProvider } =
  buyAudioSelectors
const { increaseBalance } = walletActions
const { fetchTransactionDetailsSucceeded } = transactionDetailsActions

const DEFAULT_SLIPPAGE = 3 // The default slippage amount to allow for exchanges, overridden in optimizely
const BUY_AUDIO_LOCAL_STORAGE_KEY = 'buy-audio-transaction-details'
const NUM_TRANSFER_TRANSACTIONS = 3

const MEMO_MESSAGES = {
  [OnRampProvider.COINBASE]: 'In-App $AUDIO Purchase: Coinbase Pay',
  [OnRampProvider.STRIPE]: 'In-App $AUDIO Purchase: Link by Stripe',
  [OnRampProvider.UNKNOWN]: 'In-App $AUDIO Purchase: Unknown'
}

const PROVIDER_METHOD_MAP: Record<
  OnRampProvider,
  | TransactionMethod.COINBASE
  | TransactionMethod.STRIPE
  | TransactionMethod.RECEIVE
> = {
  [OnRampProvider.COINBASE]: TransactionMethod.COINBASE,
  [OnRampProvider.STRIPE]: TransactionMethod.STRIPE,
  [OnRampProvider.UNKNOWN]: TransactionMethod.RECEIVE
}

type BuyAudioLocalStorageState = {
  transactionDetailsArgs: {
    purchaseTransactionId?: string
    swapTransactionId?: string
    transferTransactionId?: string
    estimatedUSD?: string
    purchasedLamports?: string
    purchasedAudioWei?: string
  }
  provider: OnRampProvider
  desiredAudioAmount?: AmountObject
}
const defaultBuyAudioLocalStorageState: BuyAudioLocalStorageState = {
  transactionDetailsArgs: {
    purchaseTransactionId: '',
    swapTransactionId: '',
    transferTransactionId: '',
    estimatedUSD: '',
    purchasedLamports: '',
    purchasedAudioWei: ''
  },
  provider: OnRampProvider.UNKNOWN
}

function* getLocalStorageStateWithFallback(): Generator<
  any,
  [LocalStorage, BuyAudioLocalStorageState]
> {
  const audiusLocalStorage = yield* getContext('localStorage')
  const state =
    (yield* call(
      (val: string) =>
        audiusLocalStorage.getJSONValue<BuyAudioLocalStorageState>(val),
      BUY_AUDIO_LOCAL_STORAGE_KEY
    )) ?? defaultBuyAudioLocalStorageState
  return [audiusLocalStorage, state]
}

/**
 * Checks if the associated accounts necessary for a quoted `route` exist on `rootAccount`,
 * and for those that don't, estimates the needed lamports to pay for rent exemption as they are created.
 * Uses the redux store to cache the result.
 * @returns the total amount of lamports necessary for all ATA creation rent fees in a swap and transfer
 */
function* getAssociatedAccountCreationFees({
  quote,
  rootAccount,
  feesCache
}: {
  quote: QuoteResponse
  rootAccount: PublicKey
  feesCache: ReturnType<typeof getFeesCache>
}) {
  const mintKeysSet = new Set<string>()
  for (const route of quote.routePlan) {
    mintKeysSet.add(route.swapInfo.inputMint)
    mintKeysSet.add(route.swapInfo.outputMint)
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
        mintKey: new PublicKey(mintKey)
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
  quote,
  rootAccount,
  feesCache
}: {
  quote: QuoteResponse
  rootAccount: PublicKey
  feesCache: ReturnType<typeof getFeesCache>
}) {
  let transactionFees = feesCache?.transactionFees ?? 0
  if (!transactionFees) {
    const { instructions: swapInstructions, lookupTableAddresses } =
      yield* call(JupiterSingleton.getSwapInstructions, {
        quote,
        userPublicKey: rootAccount
      })
    const userBank = yield* call(deriveUserBankPubkey, audiusBackendInstance)
    const transferTransaction = yield* call(
      createTransferToUserBankTransaction,
      {
        userBank,
        fromAccount: rootAccount,
        // eslint-disable-next-line new-cap
        amount: BigInt(quote.outAmount),
        // The provider here doesn't matter, we're not sending this transaction
        memo: MEMO_MESSAGES[OnRampProvider.COINBASE]
      }
    )
    const connection = yield* call(getSolanaConnection)

    // Calculate fees for transfer transaction (legacy transaction)
    const latestBlockhashResult = yield* call(
      [connection, connection.getLatestBlockhash],
      'finalized'
    )
    if (!transferTransaction.recentBlockhash) {
      transferTransaction.recentBlockhash = latestBlockhashResult.blockhash
    }
    if (!transferTransaction.feePayer) {
      transferTransaction.feePayer = rootAccount
    }
    transactionFees +=
      (yield* call(
        [transferTransaction, transferTransaction.getEstimatedFee],
        connection
      )) ?? TRANSACTION_FEE_FALLBACK

    // Calculate fees for swap transaction (v0 transaction)
    const lookupTableAccounts: AddressLookupTableAccount[] = []
    // Need to use for loop instead of forEach to properly await async calls
    for (const address of lookupTableAddresses) {
      if (address === undefined) continue
      const lookupTableAccount = yield* call(
        [connection, connection.getAddressLookupTable],
        new PublicKey(address)
      )
      if (lookupTableAccount.value !== null) {
        lookupTableAccounts.push(lookupTableAccount.value)
      } else {
        // Abort if a lookup table account is missing because the resulting transaction
        // might be too large
        throw new Error(`Missing lookup table account for ${address}`)
      }
    }
    const message = new TransactionMessage({
      payerKey: rootAccount,
      recentBlockhash: latestBlockhashResult.blockhash,
      instructions: swapInstructions
    }).compileToV0Message(lookupTableAccounts)
    transactionFees +=
      (yield* call([connection, connection.getFeeForMessage], message)).value ??
      TRANSACTION_FEE_FALLBACK

    yield* put(cacheTransactionFees({ transactionFees }))
  }
  return transactionFees
}

/**
 * Calculates all the fees required for executing a swap and transfer by doing a "dry-run"
 * @returns the transaction fees and ATA creation fees (in lamports)
 */
function* getSwapFees({ quote }: { quote: QuoteResponse }) {
  const feesCache = yield* select(getFeesCache)
  const rootAccount = yield* call(getRootSolanaAccount)

  const transferFee = yield* call(
    getTransferTransactionFee,
    rootAccount.publicKey
  )
  // Allows for 3 transaction fees
  const rootAccountMinBalance =
    (yield* call(getRootAccountRentExemptionMinimum)) +
    transferFee * NUM_TRANSFER_TRANSACTIONS

  const associatedAccountCreationFees = yield* call(
    getAssociatedAccountCreationFees,
    { rootAccount: rootAccount.publicKey, quote, feesCache }
  )

  const transactionFees = yield* call(getTransactionFees, {
    rootAccount: rootAccount.publicKey,
    quote,
    feesCache
  })
  console.debug(
    `Estimated transaction fees: ${
      transactionFees / LAMPORTS_PER_SOL
    } SOL. Estimated associated account rent-exemption fees: ${
      associatedAccountCreationFees / LAMPORTS_PER_SOL
    } SOL. Estimated root account rent-exemption fee: ${
      rootAccountMinBalance / LAMPORTS_PER_SOL
    } SOL. Total estimated fees: ${
      (associatedAccountCreationFees +
        transactionFees +
        rootAccountMinBalance) /
      LAMPORTS_PER_SOL
    }`
  )
  return {
    rootAccountMinBalance,
    transactionFees,
    associatedAccountCreationFees,
    totalFees:
      rootAccountMinBalance + transactionFees + associatedAccountCreationFees
  }
}

function* getBuyAudioRemoteConfig() {
  const DEFAULT_MIN_AUDIO_PURCHASE_AMOUNT = 5
  const DEFAULT_MAX_AUDIO_PURCHASE_AMOUNT = 999
  const remoteConfigInstance = yield* getContext('remoteConfigInstance')
  yield* call([remoteConfigInstance, remoteConfigInstance.waitForRemoteConfig])
  const minAudioAmount =
    remoteConfigInstance.getRemoteVar(IntKeys.MIN_AUDIO_PURCHASE_AMOUNT) ??
    DEFAULT_MIN_AUDIO_PURCHASE_AMOUNT
  const maxAudioAmount =
    remoteConfigInstance.getRemoteVar(IntKeys.MAX_AUDIO_PURCHASE_AMOUNT) ??
    DEFAULT_MAX_AUDIO_PURCHASE_AMOUNT
  const slippage =
    remoteConfigInstance.getRemoteVar(IntKeys.BUY_AUDIO_SLIPPAGE) ??
    DEFAULT_SLIPPAGE
  const retryDelayMs =
    remoteConfigInstance.getRemoteVar(IntKeys.BUY_TOKEN_WALLET_POLL_DELAY_MS) ??
    undefined
  const maxRetryCount =
    remoteConfigInstance.getRemoteVar(
      IntKeys.BUY_TOKEN_WALLET_POLL_MAX_RETRIES
    ) ?? undefined
  return {
    minAudioAmount,
    maxAudioAmount,
    slippage,
    maxRetryCount,
    retryDelayMs
  }
}

function* getAudioPurchaseInfo({
  payload: { audioAmount }
}: ReturnType<typeof calculateAudioPurchaseInfo>) {
  try {
    // Fail early if audioAmount is too small/large
    const { minAudioAmount, maxAudioAmount, slippage } = yield* call(
      getBuyAudioRemoteConfig
    )
    if (audioAmount > maxAudioAmount) {
      yield* put(
        calculateAudioPurchaseInfoFailed({
          errorType: PurchaseInfoErrorType.MAX_AUDIO_EXCEEDED,
          maxAudio: maxAudioAmount
        })
      )
      return
    } else if (audioAmount < minAudioAmount) {
      yield* put(
        calculateAudioPurchaseInfoFailed({
          errorType: PurchaseInfoErrorType.MIN_AUDIO_EXCEEDED,
          minAudio: minAudioAmount
        })
      )
      return
    }

    // Ensure userbank is created
    const feePayerOverride = yield* select(getFeePayer)
    if (!feePayerOverride) {
      console.error(`getAudioPurchaseInfo: unexpectedly no fee payer override`)
      return
    }

    yield* fork(function* () {
      yield* call(createUserBankIfNeeded, audiusBackendInstance, {
        recordAnalytics: track,
        feePayerOverride
      })
    })

    // Setup
    const connection = yield* call(getSolanaConnection)
    const rootAccount = yield* call(getRootSolanaAccount)

    // Get AUDIO => SOL quote
    const reverseQuote = yield* call(JupiterSingleton.getQuote, {
      inputTokenSymbol: 'AUDIO',
      outputTokenSymbol: 'SOL',
      inputAmount: audioAmount,
      slippage
    })
    const slippageFactor = 100.0 / (100.0 - slippage)

    // Adjust quote for potential slippage
    const inSol = Math.ceil(reverseQuote.outputAmount.amount * slippageFactor)

    // Get SOL => AUDIO quote to calculate fees
    const quote = yield* call(JupiterSingleton.getQuote, {
      inputTokenSymbol: 'SOL',
      outputTokenSymbol: 'AUDIO',
      inputAmount: inSol / LAMPORTS_PER_SOL,
      slippage
    })
    const {
      rootAccountMinBalance,
      associatedAccountCreationFees,
      transactionFees
    } = yield* call(getSwapFees, { quote: quote.quote })

    // Get existing solana balance
    const existingBalance = yield* call(
      [connection, connection.getBalance],
      rootAccount.publicKey,
      'finalized'
    )

    const estimatedLamports = Math.max(
      inSol +
        associatedAccountCreationFees +
        transactionFees +
        rootAccountMinBalance +
        existingBalance,
      0
    )

    // Get SOL => USDC quote to estimate $USD cost
    const quoteUSD = yield* call(JupiterSingleton.getQuote, {
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
        (associatedAccountCreationFees +
          rootAccountMinBalance +
          transactionFees) /
        LAMPORTS_PER_SOL
      } SOL
Existing Balance: ${existingBalance / LAMPORTS_PER_SOL} SOL
Total: ${estimatedLamports / LAMPORTS_PER_SOL} SOL ($${
        quoteUSD.outputAmount.uiAmountString
      } USDC)`
    )

    yield* put(
      calculateAudioPurchaseInfoSucceeded({
        estimatedSOL: convertBigIntToAmountObject(
          BigInt(estimatedLamports),
          TOKEN_LISTING_MAP.SOL.decimals
        ),
        estimatedUSD: quoteUSD.outputAmount,
        desiredAudioAmount: convertBigIntToAmountObject(
          BigInt(
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

function* populateAndSaveTransactionDetails() {
  // Get transaction details from local storage
  const [, localStorageState] = yield* getLocalStorageStateWithFallback()
  const {
    purchaseTransactionId,
    swapTransactionId,
    transferTransactionId,
    estimatedUSD,
    purchasedLamports,
    purchasedAudioWei
  } = localStorageState.transactionDetailsArgs

  if (!transferTransactionId) {
    throw new Error('Missing transactionDetailsArgs[transferTransactionId]')
  }

  const postAUDIOBalanceWei = yield* select(
    walletSelectors.getAccountTotalBalance
  )
  const purchasedAUDIO = purchasedAudioWei
    ? formatWei(new BN(purchasedAudioWei ?? '0') as BNWei).replaceAll(',', '')
    : ''
  const divisor = new BN(LAMPORTS_PER_SOL)
  const purchasedLamportsBN = purchasedLamports
    ? new BN(purchasedLamports)
    : new BN('0')
  const purchasedSOL = purchasedLamports
    ? `${purchasedLamportsBN.div(divisor)}.${purchasedLamportsBN
        .mod(divisor)
        .toString()
        .padStart(divisor.toString().length - 1, '0')}`
    : ''

  const transactionMetadata = {
    discriminator: TransactionMetadataType.PURCHASE_SOL_AUDIO_SWAP,
    purchaseTransactionId: purchaseTransactionId ?? '',
    swapTransactionId: swapTransactionId ?? '',
    usd: estimatedUSD ?? '',
    sol: purchasedSOL,
    audio: purchasedAUDIO
  }
  const transactionDetails: TransactionDetails = {
    date: dayjs().format('MM/DD/YYYY'),
    signature: transferTransactionId,
    transactionType: TransactionType.PURCHASE,
    method:
      PROVIDER_METHOD_MAP[localStorageState.provider ?? OnRampProvider.UNKNOWN],
    balance: !isNullOrUndefined(postAUDIOBalanceWei)
      ? convertWeiToWAudio(postAUDIOBalanceWei).toString()
      : null,
    change: purchasedAudioWei
      ? convertWeiToWAudio(new BN(purchasedAudioWei)).toString()
      : '',
    metadata: transactionMetadata
  }

  yield* put(
    fetchTransactionDetailsSucceeded({
      transactionId: transferTransactionId,
      transactionDetails
    })
  )
  yield* call(saveUserBankTransactionMetadata, {
    transactionSignature: transferTransactionId,
    metadata: transactionMetadata
  })

  // Clear local storage
  console.debug('Clearing BUY_AUDIO_LOCAL_STORAGE...')
  yield* call(
    [localStorage, localStorage.removeItem],
    BUY_AUDIO_LOCAL_STORAGE_KEY
  )
}

type PurchaseStepParams = {
  estimatedSOL: AmountObject
  connection: Connection
  rootAccount: Keypair
  provider: OnRampProvider
  retryDelayMs?: number
  maxRetryCount?: number
}
/**
 * Executes the purchase step of the on-ramp
 *
 * @throws if cannot confirm the purchase
 * @returns the new SOL balance for the rootAccount after the purchase succeeds
 */
function* purchaseStep({
  estimatedSOL,
  connection,
  rootAccount,
  provider,
  retryDelayMs,
  maxRetryCount
}: PurchaseStepParams) {
  // Cache current SOL balance and tip of transaction history
  const initialBalance = yield* call(
    [connection, connection.getBalance],
    rootAccount.publicKey,
    'finalized'
  )
  const initialTransactions = yield* call(
    [connection, connection.getSignaturesForAddress],
    rootAccount.publicKey,
    {
      limit: 1
    }
  )
  const initialTransaction = initialTransactions?.[0]?.signature

  // Wait for on ramp finish
  const result = yield* race({
    success: take(onrampSucceeded),
    canceled: take(onrampCanceled)
  })

  // If the user didn't complete the on ramp flow, return early
  if (result.canceled) {
    yield* put(make(Name.BUY_AUDIO_ON_RAMP_CANCELED, { provider }))
    return {}
  }
  yield* put(make(Name.BUY_AUDIO_ON_RAMP_SUCCESS, { provider }))

  // Wait for the SOL funds to come through
  const newBalance = yield* call(pollForSolBalanceChange, {
    rootAccount: rootAccount.publicKey,
    initialBalance,
    retryDelayMs,
    maxRetryCount
  })

  // Get the purchase transaction
  const purchaseTransactionId = yield* call(pollForNewTransaction, {
    initialTransaction,
    rootAccount: rootAccount.publicKey,
    retryDelayMs,
    maxRetryCount
  })

  // Check that we got the requested SOL
  const purchasedLamports = newBalance - initialBalance
  if (purchasedLamports !== estimatedSOL.amount) {
    console.warn(
      `Warning: Purchase SOL amount differs from expected. Actual: ${
        (newBalance - initialBalance) / LAMPORTS_PER_SOL
      } SOL. Expected: ${estimatedSOL.uiAmountString} SOL.`
    )
  }

  const [audiusLocalStorage, localStorageState] =
    yield* getLocalStorageStateWithFallback()
  localStorageState.transactionDetailsArgs.purchaseTransactionId =
    purchaseTransactionId
  localStorageState.transactionDetailsArgs.purchasedLamports =
    purchasedLamports.toString()
  yield* call(
    [audiusLocalStorage, audiusLocalStorage.setJSONValue],
    BUY_AUDIO_LOCAL_STORAGE_KEY,
    localStorageState
  )
  return { purchasedLamports, purchaseTransactionId, newBalance }
}

type SwapStepParams = {
  exchangeAmount: bigint
  desiredAudioAmount?: AmountObject
  rootAccount: Keypair
  transactionHandler: TransactionHandler
  retryDelayMs?: number
  maxRetryCount?: number
}
/**
 * Executes the Jupiter exchange from SOL to $AUDIO
 *
 * @throws if cannot confirm the swap
 * @returns the $AUDIO amount resulting from the swap
 */
function* swapStep({
  exchangeAmount,
  desiredAudioAmount,
  rootAccount,
  transactionHandler,
  retryDelayMs,
  maxRetryCount
}: SwapStepParams) {
  const { slippage } = yield* call(getBuyAudioRemoteConfig)
  // Get quote adjusted for fees
  const quote = yield* call(JupiterSingleton.getQuote, {
    inputTokenSymbol: 'SOL',
    outputTokenSymbol: 'AUDIO',
    inputAmount: Number(exchangeAmount) / LAMPORTS_PER_SOL,
    slippage
  })

  // Check that we get the desired AUDIO from the quote
  const audioAdjusted = convertBigIntToAmountObject(
    BigInt(
      Math.floor((Number(quote.quote.outAmount) * 100 - slippage) / 100.0)
    ),
    TOKEN_LISTING_MAP.AUDIO.decimals
  )
  if (
    desiredAudioAmount !== undefined &&
    desiredAudioAmount.amount > audioAdjusted.amount
  ) {
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
  const beforeSwapAudioBalance = beforeSwapAudioAccountInfo?.amount ?? BigInt(0)

  // Swap the SOL for AUDIO
  yield* put(swapStarted())
  const { instructions: swapInstructions, lookupTableAddresses } = yield* call(
    JupiterSingleton.getSwapInstructions,
    {
      quote: quote.quote,
      userPublicKey: rootAccount.publicKey
    }
  )

  const txId = yield* call(JupiterSingleton.executeExchange, {
    instructions: swapInstructions,
    feePayer: rootAccount.publicKey,
    transactionHandler,
    lookupTableAddresses
  })

  // Write transaction details to local storage
  const [audiusLocalStorage, localStorageState] =
    yield* getLocalStorageStateWithFallback()
  localStorageState.transactionDetailsArgs.swapTransactionId = txId ?? undefined
  yield* call(
    [audiusLocalStorage, audiusLocalStorage.setJSONValue],
    BUY_AUDIO_LOCAL_STORAGE_KEY,
    localStorageState
  )

  yield* put(swapCompleted())

  // Reset associated token account cache now that the swap created the accounts
  // (can't simply set all the accounts in the route to "exists" because wSOL gets closed)
  yield* put(clearFeesCache())

  // Wait for AUDIO funds to come through
  const audioSwappedSpl = yield* call(pollForAudioBalanceChange, {
    tokenAccount,
    initialBalance: beforeSwapAudioBalance,
    retryDelayMs,
    maxRetryCount
  })
  return {
    swapTransactionId: txId,
    audioSwappedSpl
  }
}

type TransferStepParams = {
  rootAccount: Keypair
  transferAmount: bigint
  transactionHandler: TransactionHandler
  provider: OnRampProvider
}
function* transferStep({
  rootAccount,
  transferAmount,
  transactionHandler,
  provider
}: TransferStepParams) {
  yield* put(transferStarted())

  const userBank = yield* call(deriveUserBankPubkey, audiusBackendInstance)
  const transferTransaction = yield* call(createTransferToUserBankTransaction, {
    userBank,
    fromAccount: rootAccount.publicKey,
    amount: transferAmount,
    memo: MEMO_MESSAGES[provider]
  })

  console.debug(`Starting transfer transaction...`)
  const { res: transferTransactionId, error: transferError } = yield* call(
    [transactionHandler, transactionHandler.handleTransaction],
    {
      instructions: transferTransaction.instructions,
      feePayerOverride: rootAccount.publicKey,
      skipPreflight: false
    }
  )
  if (transferError) {
    console.debug(
      `Transfer transaction stringified: ${JSON.stringify(transferTransaction)}`
    )
    throw new Error(`Transfer transaction failed: ${transferError}`)
  }
  const audioTransferredWei = convertWAudioToWei(
    new BN(transferAmount.toString())
  )

  // Write transaction details to local storage
  const [audiusLocalStorage, localStorageState] =
    yield* getLocalStorageStateWithFallback()
  localStorageState.transactionDetailsArgs.transferTransactionId =
    transferTransactionId ?? undefined
  localStorageState.transactionDetailsArgs.purchasedAudioWei =
    audioTransferredWei.toString()
  yield* call(
    [audiusLocalStorage, audiusLocalStorage.setJSONValue],
    BUY_AUDIO_LOCAL_STORAGE_KEY,
    localStorageState
  )

  // Update wallet balance optimistically
  yield* put(
    increaseBalance({
      amount: weiToString(audioTransferredWei)
    })
  )
  yield* put(transferCompleted())

  return { audioTransferredWei, transferTransactionId }
}

/**
 * Exchanges all but the minimum balance required for a swap from a wallet once a balance change is seen
 */
function* doBuyAudio({
  payload: { desiredAudioAmount, estimatedSOL, estimatedUSD }
}: ReturnType<typeof onrampOpened>) {
  const provider = yield* select(getBuyAudioProvider)
  let userRootWallet = ''
  try {
    // Record start
    yield* put(
      make(Name.BUY_AUDIO_ON_RAMP_OPENED, {
        provider
      })
    )

    // Initialize local storage
    const audiusLocalStorage = yield* getContext('localStorage')
    const initialState: BuyAudioLocalStorageState = {
      ...defaultBuyAudioLocalStorageState,
      transactionDetailsArgs: {
        ...defaultBuyAudioLocalStorageState.transactionDetailsArgs,
        estimatedUSD: estimatedUSD.uiAmountString
      },
      provider,
      desiredAudioAmount
    }
    yield* call(
      [audiusLocalStorage, audiusLocalStorage.setJSONValue],
      BUY_AUDIO_LOCAL_STORAGE_KEY,
      initialState
    )

    // Setup
    const rootAccount: Keypair = yield* call(getRootSolanaAccount)
    const connection = yield* call(getSolanaConnection)
    const transactionHandler = new TransactionHandler({
      connection,
      useRelay: false,
      feePayerKeypairs: [rootAccount],
      skipPreflight: false
    })
    userRootWallet = rootAccount.publicKey.toString()

    // Get config
    const { retryDelayMs, maxRetryCount, slippage } = yield* call(
      getBuyAudioRemoteConfig
    )

    // Ensure userbank is created
    const feePayerOverride = yield* select(getFeePayer)
    if (!feePayerOverride) {
      console.error('doBuyAudio: unexpectedly no fee payer override')
      return
    }
    yield* fork(function* () {
      yield* call(createUserBankIfNeeded, audiusBackendInstance, {
        recordAnalytics: track,
        feePayerOverride
      })
    })

    // STEP ONE: Wait for purchase
    // Have to do some typescript finangling here due to the "race" effect in purchaseStep
    // See https://github.com/agiledigital/typed-redux-saga/issues/43
    const { newBalance } = (yield* call(purchaseStep, {
      provider,
      estimatedSOL,
      connection,
      rootAccount,
      retryDelayMs,
      maxRetryCount
    }) as unknown as ReturnType<typeof purchaseStep>)!

    // If the user canceled the purchase, stop the flow
    if (newBalance === undefined) {
      return
    }

    // Get dummy quote to calculate fees and get exchange amount
    const quote = yield* call(JupiterSingleton.getQuote, {
      inputTokenSymbol: 'SOL',
      outputTokenSymbol: 'AUDIO',
      inputAmount: newBalance / LAMPORTS_PER_SOL,
      slippage
    })
    const { totalFees } = yield* call(getSwapFees, { quote: quote.quote })
    const exchangeAmount = newBalance - totalFees
    console.debug(
      `Exchanging ${exchangeAmount / LAMPORTS_PER_SOL} SOL to AUDIO`
    )

    // STEP TWO: Swap to $AUDIO
    const { audioSwappedSpl } = yield* call(swapStep, {
      exchangeAmount: BigInt(exchangeAmount),
      desiredAudioAmount,
      rootAccount,
      transactionHandler,
      retryDelayMs,
      maxRetryCount
    })

    // STEP THREE: Transfer $AUDIO to user bank
    const { audioTransferredWei } = yield* call(transferStep, {
      transferAmount: audioSwappedSpl,
      transactionHandler,
      rootAccount,
      provider
    })

    // Save transaction details
    yield* call(populateAndSaveTransactionDetails)

    // Record success
    yield* put(
      make(Name.BUY_AUDIO_SUCCESS, {
        provider,
        requestedAudio: desiredAudioAmount,
        actualAudio: parseFloat(
          formatWei(audioTransferredWei).replaceAll(',', '')
        ),
        surplusAudio: parseFloat(
          formatWei(
            convertWAudioToWei(
              new BN(
                (audioSwappedSpl - BigInt(desiredAudioAmount.amount)).toString()
              )
            )
          ).replaceAll(',', '')
        )
      })
    )
  } catch (e) {
    const stage = yield* select(getBuyAudioFlowStage)
    yield* call(reportToSentry, {
      level: ErrorLevel.Error,
      error: e as Error,
      additionalInfo: { stage, userRootWallet }
    })
    yield* put(buyAudioFlowFailed())
    yield* put(
      make(Name.BUY_AUDIO_FAILURE, {
        provider,
        stage,
        requestedAudio: desiredAudioAmount.uiAmountString,
        name: 'BuyAudio failed',
        error: (e as Error).message
      })
    )
  }
}

/**
 * There are three main steps that could have failed:
 * 1) The purchase went through, but the Jupiter swap failed, leaving some SOL in the root account
 * 2) The purchase and swap went through, but the final transfer failed, leaving some $AUDIO in the root account
 * 3) The purchase, swap, and final transfer all went through, but writing transaction details metadata failed
 *
 * This function checks for the above conditions sequentially, and pops the modal as necessary.
 */
function* recoverPurchaseIfNecessary() {
  let provider = OnRampProvider.UNKNOWN
  let didNeedRecovery = false
  let userRootWallet = ''
  let recoveredAudio: null | number = null
  try {
    // Bail if not enabled
    yield* call(waitForWrite)
    const getFeatureEnabled = yield* getContext('getFeatureEnabled')

    if (
      !(
        getFeatureEnabled(FeatureFlags.BUY_AUDIO_COINBASE_ENABLED) ||
        getFeatureEnabled(FeatureFlags.BUY_AUDIO_STRIPE_ENABLED)
      )
    ) {
      return
    }

    // Setup
    const rootAccount: Keypair = yield* call(getRootSolanaAccount)
    const connection = yield* call(getSolanaConnection)
    const transactionHandler = new TransactionHandler({
      connection,
      useRelay: false,
      feePayerKeypairs: [rootAccount],
      skipPreflight: false
    })
    userRootWallet = rootAccount.publicKey.toString()

    // Restore local storage state, lightly sanitizing
    const audiusLocalStorage = yield* getContext('localStorage')
    const savedLocalStorageState = (yield* call(
      (val) => audiusLocalStorage.getJSONValue<BuyAudioLocalStorageState>(val),
      BUY_AUDIO_LOCAL_STORAGE_KEY
    )) ?? { transactionDetailsArgs: {} }
    const localStorageState: BuyAudioLocalStorageState = {
      ...defaultBuyAudioLocalStorageState,
      ...savedLocalStorageState,
      transactionDetailsArgs: {
        ...defaultBuyAudioLocalStorageState.transactionDetailsArgs,
        ...savedLocalStorageState?.transactionDetailsArgs
      }
    }
    yield* call(
      [audiusLocalStorage, audiusLocalStorage.setJSONValue],
      BUY_AUDIO_LOCAL_STORAGE_KEY,
      localStorageState
    )
    provider = localStorageState.provider

    // Get config
    const { slippage, maxRetryCount, retryDelayMs } = yield* call(
      getBuyAudioRemoteConfig
    )

    // Get existing SOL balance
    const existingBalance = yield* call(
      [connection, connection.getBalance],
      rootAccount.publicKey,
      'finalized'
    )

    // Get dummy quote and calculate fees
    const quote = yield* call(JupiterSingleton.getQuote, {
      inputTokenSymbol: 'SOL',
      outputTokenSymbol: 'AUDIO',
      inputAmount: existingBalance / LAMPORTS_PER_SOL,
      slippage
    })
    const { totalFees, rootAccountMinBalance } = yield* call(getSwapFees, {
      quote: quote.quote
    })

    // Subtract fees and rent to see how much SOL is available to exchange
    const exchangableBalance = BigInt(existingBalance - totalFees)

    // Use proportion to guesstimate an $AUDIO quote for the exchangeable balance
    const estimatedAudio =
      existingBalance > 0
        ? (BigInt(exchangableBalance) * BigInt(quote.outputAmount.amount)) /
          BigInt(existingBalance)
        : BigInt(0)

    // Check if there's a non-zero exchangeble amount of SOL and at least one $AUDIO would be output
    // Should only occur as the result of a previously failed Swap
    if (
      exchangableBalance > BigInt(0) &&
      estimatedAudio > BigInt(1 * 10 ** TOKEN_LISTING_MAP.AUDIO.decimals)
    ) {
      yield* put(
        make(Name.BUY_AUDIO_RECOVERY_OPENED, {
          provider,
          trigger: 'SOL',
          balance: exchangableBalance.toString()
        })
      )
      console.debug(
        `Found existing SOL balance of ${
          existingBalance / LAMPORTS_PER_SOL
        } SOL, converting ${
          Number(exchangableBalance) / LAMPORTS_PER_SOL
        } SOL to AUDIO... (~${estimatedAudio.toString()} $AUDIO SPL)`
      )

      yield* put(setVisibility({ modal: 'BuyAudioRecovery', visible: true }))
      yield* put(setVisibility({ modal: 'BuyAudio', visible: false }))
      didNeedRecovery = true

      const { audioSwappedSpl } = yield* call(swapStep, {
        exchangeAmount: exchangableBalance,
        desiredAudioAmount: localStorageState.desiredAudioAmount,
        rootAccount,
        transactionHandler,
        maxRetryCount,
        retryDelayMs
      })
      const { audioTransferredWei } = yield* call(transferStep, {
        transferAmount: audioSwappedSpl,
        rootAccount,
        transactionHandler,
        provider: localStorageState.provider ?? OnRampProvider.UNKNOWN
      })
      recoveredAudio = parseFloat(
        formatWei(audioTransferredWei).replaceAll(',', '')
      )
      yield* call(populateAndSaveTransactionDetails)
    } else {
      // Check for $AUDIO in the account and transfer if necessary
      const tokenAccount = yield* call(getAudioAccount, {
        rootAccount: rootAccount.publicKey
      })
      const audioAccountInfo = yield* call(getAudioAccountInfo, {
        tokenAccount
      })
      const audioBalance = audioAccountInfo?.amount ?? BigInt(0)

      // If the user's root wallet has $AUDIO, that usually indicates a failed transfer
      if (audioBalance > BigInt(0)) {
        // Check we can afford to transfer
        if (existingBalance - rootAccountMinBalance > 0) {
          yield* put(
            make(Name.BUY_AUDIO_RECOVERY_OPENED, {
              provider,
              trigger: '$AUDIO',
              balance: audioBalance.toString()
            })
          )
          console.debug(
            `Found existing $AUDIO balance of ${audioBalance}, transferring to user bank...`
          )

          yield* put(
            setVisibility({ modal: 'BuyAudioRecovery', visible: true })
          )
          yield* put(setVisibility({ modal: 'BuyAudio', visible: false }))
          didNeedRecovery = true

          const { audioTransferredWei } = yield* call(transferStep, {
            transferAmount: audioBalance,
            rootAccount,
            transactionHandler,
            provider: localStorageState.provider ?? OnRampProvider.UNKNOWN
          })
          recoveredAudio = parseFloat(
            formatWei(audioTransferredWei).replaceAll(',', '')
          )
          yield* call(populateAndSaveTransactionDetails)
        } else {
          // User can't afford to transfer their $AUDIO
          console.debug(
            `OWNED: ${audioBalance.toString()} $AUDIO (spl wei) ${existingBalance.toString()} SOL (lamports)\n` +
              `NEED: ${totalFees.toString()} SOL (lamports)`
          )
          throw new Error(`User is bricked`)
        }
      } else if (
        localStorageState?.transactionDetailsArgs?.transferTransactionId
      ) {
        // If we previously just failed to save the metadata, try that again
        console.debug('Only need to resend metadata...')
        const metadata = yield* call(
          getUserBankTransactionMetadata,
          localStorageState.transactionDetailsArgs.transferTransactionId
        )
        if (!metadata) {
          yield* call(populateAndSaveTransactionDetails)
        }
      }
    }
    yield* put(setVisibility({ modal: 'BuyAudioRecovery', visible: false }))
    if (didNeedRecovery) {
      // If we don't reset state here, this shows the success screen :)
      yield* put(setVisibility({ modal: 'BuyAudio', visible: true }))

      // Report Success
      yield* put(
        make(Name.BUY_AUDIO_RECOVERY_SUCCESS, {
          provider,
          recoveredAudio
        })
      )
    }
  } catch (e) {
    const stage = yield* select(getBuyAudioFlowStage)
    yield* call(reportToSentry, {
      level: ErrorLevel.Error,
      name: 'BuyAudioRecovery failed',
      error: e as Error,
      additionalInfo: { stage, didNeedRecovery, userRootWallet }
    })
    // For now, hide modal on error.
    // TODO: add UI for failures later
    yield* put(setVisibility({ modal: 'BuyAudioRecovery', visible: false }))
    yield* put(
      make(Name.BUY_AUDIO_RECOVERY_FAILURE, {
        provider,
        stage,
        error: (e as Error).message
      })
    )
  }
}

function* doStartBuyAudioFlow(action: ReturnType<typeof startBuyAudioFlow>) {
  yield* put(setVisibility({ modal: 'BuyAudio', visible: true }))
  yield* put(startRecoveryIfNecessary())
}

function* watchCalculateAudioPurchaseInfo() {
  yield takeLatest(calculateAudioPurchaseInfo, getAudioPurchaseInfo)
}

function* watchOnRampOpened() {
  yield takeLatest(onrampOpened, doBuyAudio)
}

function* watchStartBuyAudioFlow() {
  yield takeLatest(startBuyAudioFlow, doStartBuyAudioFlow)
}

function* watchRecovery() {
  // Use takeLeading since:
  // 1) We don't want to run more than one recovery flow at a time (so not takeEvery)
  // 2) We don't need to interrupt if already running (so not takeLatest)
  // 3) We do want to be able to trigger more than one time per session in case of same-session failures (so not take)
  yield takeLeading(startRecoveryIfNecessary, recoverPurchaseIfNecessary)
}

/**
 * If the user closed the page or encountered an error in the BuyAudio flow, retry on refresh/next session.
 * Gate on local storage existing for the previous purchase attempt to reduce RPC load.
 */
function* recoverOnPageLoad() {
  const audiusLocalStorage = yield* getContext('localStorage')
  const savedLocalStorageState = yield* call(
    (val) => audiusLocalStorage.getJSONValue<BuyAudioLocalStorageState>(val),
    BUY_AUDIO_LOCAL_STORAGE_KEY
  )
  if (savedLocalStorageState !== null && !isMobileWeb()) {
    yield* put(startRecoveryIfNecessary())
  }
}

export default function sagas() {
  return [
    watchOnRampOpened,
    watchCalculateAudioPurchaseInfo,
    watchStartBuyAudioFlow,
    watchRecovery,
    recoverOnPageLoad
  ]
}
