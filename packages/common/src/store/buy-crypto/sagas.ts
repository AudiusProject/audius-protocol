import {
  NATIVE_MINT,
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction
} from '@solana/web3.js'
import {
  call,
  delay,
  put,
  race,
  select,
  take,
  takeLatest
} from 'typed-redux-saga'

import { Name } from '~/models/Analytics'
import { ErrorLevel } from '~/models/ErrorReporting'
import {
  SLIPPAGE_TOLERANCE_EXCEEDED_ERROR,
  jupiterInstance,
  parseJupiterInstruction,
  quoteWithAnalytics
} from '~/services/Jupiter'
import {
  MEMO_PROGRAM_ID,
  MintName,
  createUserBankIfNeeded,
  createVersionedTransaction,
  getRootSolanaAccount,
  getTokenAccountInfo,
  pollForBalanceChange,
  pollForTokenBalanceChange,
  relayVersionedTransaction
} from '~/services/audius-backend/solana'
import { FeatureFlags } from '~/services/index'
import { IntKeys } from '~/services/remote-config/types'
import {
  onrampCanceled,
  onrampFailed,
  onrampSucceeded,
  buyCryptoViaSol,
  buyCryptoCanceled,
  buyCryptoFailed,
  buyCryptoSucceeded,
  buyCryptoRecoverySucceeded,
  buyCryptoRecoveryFailed
} from '~/store/buy-crypto/slice'
import { getBuyUSDCRemoteConfig } from '~/store/buy-usdc'
import { getContext } from '~/store/commonStore'
import { getFeePayer } from '~/store/solana/selectors'
import { TOKEN_LISTING_MAP } from '~/store/ui/buy-audio/constants'
import { OnRampProvider } from '~/store/ui/buy-audio/types'
import { setVisibility } from '~/store/ui/modals/parentSlice'
import { initializeStripeModal } from '~/store/ui/stripe-modal/slice'
import { waitForAccount, waitForValue } from '~/utils/sagaHelpers'

import { getSDK } from '../sdkUtils'

import {
  BuyCryptoConfig,
  BuyCryptoError,
  BuyCryptoErrorCode,
  BuyCryptoViaSolLocalStorageState
} from './types'

const BUY_CRYPTO_VIA_SOL_STATE_KEY = 'buy_crypto_via_sol'
const LOCAL_STORAGE_STATE_TTL_MS = 1000 * 60 * 60 * 2 // 2 hours (arbitrary)

function* getBuyAudioRemoteConfig() {
  // Default slippage tolerance, in percentage basis points
  const DEFAULT_SLIPPAGE_BPS = 30
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
    DEFAULT_SLIPPAGE_BPS
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

function* getBuyCryptoRemoteConfig(mint: MintName) {
  if (mint === 'usdc') {
    const config = yield* call(getBuyUSDCRemoteConfig)
    return {
      maxAmount: config.maxUSDCPurchaseAmountCents / 100.0,
      minAmount: config.minUSDCPurchaseAmountCents / 100.0,
      slippageBps: config.slippage,
      retryDelayMs: config.retryDelayMs,
      maxRetryCount: config.maxRetryCount
    } as BuyCryptoConfig
  } else {
    const config = yield* call(getBuyAudioRemoteConfig)
    return {
      maxAmount: config.maxAudioAmount,
      minAmount: config.minAudioAmount,
      slippageBps: config.slippage,
      retryDelayMs: config.retryDelayMs,
      maxRetryCount: config.maxRetryCount
    } as BuyCryptoConfig
  }
}

function* swapSolForCrypto({
  wallet,
  mint,
  feePayer,
  quoteResponse,
  userbank
}: {
  wallet: Keypair
  mint: MintName
  feePayer: PublicKey
  userbank: PublicKey
  quoteResponse: Awaited<ReturnType<typeof jupiterInstance.quoteGet>>
}) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  // Create a memo
  // See: https://github.com/solana-labs/solana-program-library/blob/d6297495ea4dcc1bd48f3efdd6e3bbdaef25a495/memo/js/src/index.ts#L27
  const memoInstruction = new TransactionInstruction({
    keys: [
      {
        pubkey: wallet.publicKey,
        isSigner: true,
        isWritable: true
      }
    ],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(`In-App $${mint.toUpperCase()} Purchase: Link by Stripe`)
  })

  // Create a temp wSOL account
  const walletSolTokenAccount = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    wallet.publicKey
  )
  const createWSOLInstruction =
    createAssociatedTokenAccountIdempotentInstruction(
      feePayer, // fee payer
      walletSolTokenAccount, // account to create
      wallet.publicKey, // owner
      NATIVE_MINT // mint
    )

  // Transfer the SOL to the wSOL account
  const transferWSOLInstruction = SystemProgram.transfer({
    fromPubkey: wallet.publicKey,
    toPubkey: walletSolTokenAccount,
    lamports:
      quoteResponse.swapMode === 'ExactIn'
        ? BigInt(quoteResponse.inAmount)
        : BigInt(quoteResponse.otherAmountThreshold)
  })
  const syncNativeInstruction = createSyncNativeInstruction(
    walletSolTokenAccount
  )

  // Swap the new SOL amount into the desired token amount
  const { swapInstruction, addressLookupTableAddresses } = yield* call(
    [jupiterInstance, jupiterInstance.swapInstructionsPost],
    {
      swapRequest: {
        quoteResponse,
        userPublicKey: wallet.publicKey.toBase58(),
        destinationTokenAccount: userbank.toBase58(),
        useSharedAccounts: true
      }
    }
  )

  // Close the temporary wSOL account
  const closeWSOLInstruction = createCloseAccountInstruction(
    walletSolTokenAccount, //  account to close
    feePayer, // fee destination
    wallet.publicKey //  owner
  )

  const instructions = [
    memoInstruction,
    createWSOLInstruction,
    transferWSOLInstruction,
    syncNativeInstruction,
    parseJupiterInstruction(swapInstruction),
    closeWSOLInstruction
  ]
  const sdk = yield* getSDK()
  const { transaction, addressLookupTableAccounts } = yield* call(
    createVersionedTransaction,
    audiusBackendInstance,
    {
      instructions,
      lookupTableAddresses: addressLookupTableAddresses,
      feePayer,
      sdk
    }
  )
  transaction.sign([wallet])

  return yield* call(relayVersionedTransaction, audiusBackendInstance, {
    transaction,
    addressLookupTableAccounts,
    skipPreflight: true
  })
}

function* assertRecoverySuccess({
  res,
  swapError,
  recoveryError,
  mint
}: {
  res: string | null
  swapError: string | null
  recoveryError: string | null
  mint: MintName
}) {
  if (recoveryError) {
    throw new BuyCryptoError(
      BuyCryptoErrorCode.SWAP_ERROR,
      `Failed to recover ${mint.toUpperCase()} from SOL: ${recoveryError}. Initial Swap Error: ${swapError}`
    )
  } else if (!res) {
    throw new BuyCryptoError(
      BuyCryptoErrorCode.UNKNOWN,
      `Unknown error during recovery swap. Initial Swap Error: ${swapError}`
    )
  }
}

function* doBuyCryptoViaSol({
  payload: { amount, mint, provider }
}: ReturnType<typeof buyCryptoViaSol>) {
  // Pull from context
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const { track, make } = yield* getContext('analytics')
  const reportToSentry = yield* getContext('reportToSentry')
  const audiusLocalStorage = yield* getContext('localStorage')

  yield* call(
    track,
    make({
      eventName: Name.BUY_CRYPTO_STARTED,
      mint,
      provider,
      requestedAmount: amount
    })
  )

  // Get config
  const wallet = yield* call(getRootSolanaAccount, audiusBackendInstance)
  const feePayerAddress = yield* select(getFeePayer)
  const config = yield* call(getBuyCryptoRemoteConfig, mint)
  const outputToken = TOKEN_LISTING_MAP[mint.toUpperCase()]
  let userbank: PublicKey | null = null
  try {
    // Validate inputs
    // TODO: Re-add Coinbase support when rewriting BuyAudio
    if (provider !== OnRampProvider.STRIPE) {
      throw new BuyCryptoError(
        BuyCryptoErrorCode.BAD_PROVIDER,
        'Only Link by Stripe is supported'
      )
    }

    if (amount < config.minAmount) {
      throw new BuyCryptoError(
        BuyCryptoErrorCode.BAD_AMOUNT,
        `Amount is below app-configured minimum of ${
          config.minAmount
        } $${mint.toUpperCase()}`
      )
    }

    if (amount > config.maxAmount) {
      throw new BuyCryptoError(
        BuyCryptoErrorCode.BAD_AMOUNT,
        `Amount is above app-configured maximum of ${config.maxAmount}`
      )
    }

    if (!outputToken) {
      throw new BuyCryptoError(
        BuyCryptoErrorCode.BAD_TOKEN,
        `Unrecognized token: ${mint}`
      )
    }

    if (!feePayerAddress) {
      throw new BuyCryptoError(
        BuyCryptoErrorCode.BAD_FEE_PAYER,
        'Fee Payer is missing'
      )
    }

    // Set up computed vars
    const outputTokenLamports = 10 ** outputToken.decimals
    const feePayer = new PublicKey(feePayerAddress)
    userbank = yield* call(createUserBankIfNeeded, audiusBackendInstance, {
      mint,
      feePayerOverride: feePayerAddress,
      recordAnalytics: track
    })

    // Get required SOL purchase amount via ExactOut + minRent.
    const quoteResponse = yield* call(quoteWithAnalytics, {
      quoteArgs: {
        inputMint: TOKEN_LISTING_MAP.SOL.address,
        outputMint: outputToken.address,
        amount: Math.ceil(amount * outputTokenLamports),
        swapMode: 'ExactOut',
        slippageBps: config.slippageBps
      },
      track,
      make
    })

    const sdk = yield* getSDK()
    const connection = sdk.services.solanaClient.connection
    const minRent = yield* call(
      [connection, connection.getMinimumBalanceForRentExemption],
      0
    )
    // otherAmountThreshold is the max input amount for the given slippage.
    // Note: ignores any existing SOL as it should be recovered and swapped into USDC
    const requiredAmount = Number(quoteResponse.otherAmountThreshold) + minRent

    // Get min stripe purchase amount using USDC as quote for $1
    const minQuote = yield* call(quoteWithAnalytics, {
      quoteArgs: {
        inputMint: TOKEN_LISTING_MAP.SOL.address,
        outputMint: TOKEN_LISTING_MAP.USDC.address,
        amount: 1 * 10 ** TOKEN_LISTING_MAP.USDC.decimals,
        swapMode: 'ExactOut',
        slippageBps: config.slippageBps
      },
      track,
      make
    })

    const minAmount = Number(minQuote.otherAmountThreshold)
    if (requiredAmount < minAmount) {
      console.warn(
        `Stripe requires minimum purchase of $1 (${minAmount} lamports). Required lamports: ${requiredAmount}`
      )
    }
    const lamportsToPurchase = Math.max(requiredAmount, minAmount)

    // Open Stripe Modal
    // TODO: Support coinbase similarly?
    yield* put(
      initializeStripeModal({
        amount: (lamportsToPurchase / LAMPORTS_PER_SOL).toString(),
        destinationCurrency: 'sol',
        destinationWallet: wallet.publicKey.toBase58(),
        onrampCanceled: onrampCanceled(),
        onrampFailed: onrampFailed({}),
        onrampSucceeded: onrampSucceeded()
      })
    )
    yield* put(setVisibility({ modal: 'StripeOnRamp', visible: true }))

    yield* call(
      track,
      make({
        eventName: Name.BUY_CRYPTO_ON_RAMP_OPENED,
        mint,
        provider,
        requestedAmount: amount
      })
    )

    // Get initial balance
    const existingBalance = yield* call(
      [connection, connection.getBalance],
      wallet.publicKey
    )
    const initialBalance = BigInt(existingBalance)

    // Wait for on ramp finish
    const result = yield* race({
      failure: take(onrampFailed),
      success: take(onrampSucceeded),
      canceled: take(onrampCanceled)
    })

    // If the user didn't complete the on ramp flow or it failed, return early
    if (result.canceled) {
      yield* call(
        track,
        make({
          eventName: Name.BUY_CRYPTO_ON_RAMP_CANCELED,
          mint,
          provider,
          requestedAmount: amount
        })
      )
      yield* put(buyCryptoCanceled())
      return
    } else if (result.failure) {
      const errorString = result.failure.payload?.error
        ? result.failure.payload.error.message
        : 'Unknown error'

      yield* call(
        track,
        make({
          eventName: Name.BUY_CRYPTO_ON_RAMP_FAILURE,
          mint,
          provider,
          requestedAmount: amount,
          error: errorString
        })
      )
      if (
        result.failure.payload?.error?.code ===
        'crypto_onramp_unsupported_country'
      ) {
        throw new BuyCryptoError(
          BuyCryptoErrorCode.COUNTRY_NOT_SUPPORTED,
          errorString
        )
      }
      throw new BuyCryptoError(BuyCryptoErrorCode.ON_RAMP_ERROR, errorString)
    }

    // Update local storage
    const localStorageState: BuyCryptoViaSolLocalStorageState = {
      amount,
      mint,
      provider,
      createdAt: Date.now(),
      intendedLamports: Number(quoteResponse.otherAmountThreshold)
    }
    yield* call(
      [audiusLocalStorage, audiusLocalStorage.setJSONValue],
      BUY_CRYPTO_VIA_SOL_STATE_KEY,
      localStorageState
    )

    // Record analytics
    yield* call(
      track,
      make({
        eventName: Name.BUY_CRYPTO_ON_RAMP_SUCCESS,
        mint,
        provider,
        requestedAmount: amount
      })
    )

    // Wait for the funds to come through
    const newBalance = yield* call(
      pollForBalanceChange,
      audiusBackendInstance,
      {
        wallet: wallet.publicKey,
        sdk,
        initialBalance,
        retryDelayMs: config.retryDelayMs,
        maxRetryCount: config.maxRetryCount
      }
    )

    // Check that we got the requested amount of SOL
    const purchasedAmount = newBalance - initialBalance
    if (purchasedAmount < BigInt(lamportsToPurchase)) {
      console.warn(
        `Warning: Purchased SOL amount differs from expected. Actual: ${
          newBalance - initialBalance
        }. Expected: ${lamportsToPurchase}.`
      )
    }

    // Record analytics
    yield* call(
      track,
      make({
        eventName: Name.BUY_CRYPTO_ON_RAMP_CONFIRMED,
        mint,
        provider,
        requestedAmount: amount
      })
    )

    // Save pre swap token balance
    const account = yield* call(getTokenAccountInfo, sdk, {
      tokenAccount: userbank
    })
    const preSwapTokenBalance = account?.amount ?? BigInt(0)

    // Try the swap a few times in hopes the price comes back if it slipped
    let swapError: string | null = null
    let swapTransactionSignature: string | null = null
    let retryCount = 0
    // TODO: Put these into optimizely?
    const maxRetryCount = 3
    const retryDelayMs = 3000
    do {
      const { res, error } = yield* call(swapSolForCrypto, {
        feePayer,
        mint,
        wallet,
        userbank,
        quoteResponse
      })
      swapError = error
      swapTransactionSignature = res
      if (
        swapError &&
        retryCount < maxRetryCount &&
        swapError.includes(`${SLIPPAGE_TOLERANCE_EXCEEDED_ERROR}`)
      ) {
        console.warn(
          `Failed to swap: ${swapError}. Retrying ${
            retryCount + 1
          } of ${maxRetryCount}...`
        )
        yield* delay(retryDelayMs)
      }
    } while (!!swapError && retryCount++ < maxRetryCount)

    // If the swap fails to get the desired ExactOut amount, fall back to
    // swapping the amount of SOL the user bought into the target token.
    if (swapError) {
      console.error(
        `Failed to swap for requested ${amount} ${mint.toUpperCase()}. Attempting to salvage all ${mint.toUpperCase()} possible...`,
        swapError
      )
      // Get "amount" in terms of wei
      const expectedAmount = BigInt(quoteResponse.outAmount)
      // Get the amount to swap using the new balance less the min required for rent
      // Note: This disregards the existing SOL balance, but there shouldn't be any
      const newBalance = yield* call(
        [connection, connection.getBalance],
        wallet.publicKey
      )
      const salvageInputAmount = newBalance - minRent
      console.info(
        `Attempting to salvage ${salvageInputAmount} SOL into ${mint.toUpperCase()}`
      )

      // Get a quote for swapping the entire balance
      const exactInQuote = yield* call(quoteWithAnalytics, {
        quoteArgs: {
          inputMint: TOKEN_LISTING_MAP.SOL.address,
          outputMint: TOKEN_LISTING_MAP[mint.toUpperCase()].address,
          amount: salvageInputAmount,
          swapMode: 'ExactIn',
          slippageBps: config.slippageBps
        },
        track,
        make
      })

      // Do the swap. Just do it once, slippage shouldn't be a
      // concern since the quote is fresh and the tolerance is high.
      const { res, error: recoveryError } = yield* call(swapSolForCrypto, {
        quoteResponse: exactInQuote,
        mint,
        wallet,
        userbank,
        feePayer
      })
      yield* call(assertRecoverySuccess, {
        res,
        swapError,
        recoveryError,
        mint
      })
      const outputTokenChange = yield* call(
        pollForTokenBalanceChange,
        audiusBackendInstance,
        {
          initialBalance: preSwapTokenBalance,
          tokenAccount: userbank,
          mint,
          retryDelayMs: config.retryDelayMs,
          maxRetryCount: config.maxRetryCount
        }
      )
      console.info(
        `Salvaged ${
          exactInQuote.inAmount
        } SOL into ${outputTokenChange} ${mint.toUpperCase()}: ${res}`
      )
      if (
        outputTokenChange === undefined ||
        outputTokenChange < expectedAmount
      ) {
        // Clear local storage - the SOL is gone, but we just didn't get enough
        // of the output token
        yield* call(
          [audiusLocalStorage, audiusLocalStorage.removeItem],
          BUY_CRYPTO_VIA_SOL_STATE_KEY
        )
        throw new BuyCryptoError(
          BuyCryptoErrorCode.INSUFFICIENT_FUNDS_ERROR,
          `Failed to swap SOL to ${expectedAmount} ${mint.toUpperCase()}. Initial Swap Error: ${swapError}.`
        )
      }
    } else if (!swapTransactionSignature) {
      throw new BuyCryptoError(
        BuyCryptoErrorCode.UNKNOWN,
        'Unknown error during initial swap'
      )
    }

    // Record success
    yield* call(
      track,
      make({
        eventName: Name.BUY_CRYPTO_ON_RAMP_SUCCESS,
        mint,
        provider,
        requestedAmount: amount
      })
    )
    yield* put(buyCryptoSucceeded())

    // Clear local storage
    yield* call(
      [audiusLocalStorage, audiusLocalStorage.removeItem],
      BUY_CRYPTO_VIA_SOL_STATE_KEY
    )
  } catch (e) {
    const error =
      e instanceof BuyCryptoError
        ? e
        : new BuyCryptoError(BuyCryptoErrorCode.UNKNOWN, `${e}`)
    yield* put(buyCryptoFailed({ error }))
    yield* call(reportToSentry, {
      level: ErrorLevel.Error,
      error,
      additionalInfo: {
        wallet: wallet.publicKey.toBase58(),
        userbank: userbank?.toBase58()
      }
    })
    yield* call(
      track,
      make({
        eventName: Name.BUY_CRYPTO_ON_RAMP_FAILURE,
        mint,
        provider,
        requestedAmount: amount,
        error: error.message
      })
    )
  }
}

/**
 * Failures happen when the on ramp purchase could not be confirmed, or the
 * subsequent swap attempts all fail. Get the SOL balance of the wallet, and
 * if it has a balance greater than min rent, attempt to swap all of it to the
 * output token. If we get enough of the output token after the swap, it's a
 * successful recovery.
 */
function* recoverBuyCryptoViaSolIfNecessary() {
  yield* call(waitForAccount)
  // Pull from context
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const { track, make } = yield* getContext('analytics')
  const reportToSentry = yield* getContext('reportToSentry')

  // Return early if feature not enabled
  if (!getFeatureEnabled(FeatureFlags.BUY_USDC_VIA_SOL)) {
    return
  }

  // Check for local storage
  const audiusLocalStorage = yield* getContext('localStorage')
  const localStorageState = yield* call(
    [
      audiusLocalStorage,
      audiusLocalStorage.getJSONValue<BuyCryptoViaSolLocalStorageState>
    ],
    BUY_CRYPTO_VIA_SOL_STATE_KEY
  )

  // Do nothing if there's no local storage state
  if (!localStorageState) {
    return
  }

  const { mint, amount, provider, createdAt, intendedLamports } =
    localStorageState
  yield* call(
    track,
    make({
      eventName: Name.BUY_CRYPTO_RECOVERY_STARTED,
      mint,
      provider,
      requestedAmount: amount,
      intendedSOL: intendedLamports / LAMPORTS_PER_SOL
    })
  )

  // Get config
  const wallet = yield* call(getRootSolanaAccount, audiusBackendInstance)
  const sdk = yield* getSDK()
  const connection = sdk.services.solanaClient.connection
  const feePayerAddress = yield* waitForValue(getFeePayer)
  const config = yield* call(getBuyCryptoRemoteConfig, mint)
  const outputToken = TOKEN_LISTING_MAP[mint.toUpperCase()]
  let userbank: PublicKey | null = null

  // Pre-emptively clear while working
  yield* call(
    [audiusLocalStorage, audiusLocalStorage.removeItem],
    BUY_CRYPTO_VIA_SOL_STATE_KEY
  )

  try {
    if (!feePayerAddress) {
      throw new BuyCryptoError(
        BuyCryptoErrorCode.BAD_FEE_PAYER,
        'Fee Payer is missing'
      )
    }

    const outputTokenLamports = 10 ** outputToken.decimals
    const expectedAmount = Math.ceil(amount * outputTokenLamports)
    const feePayer = new PublicKey(feePayerAddress)
    userbank = yield* call(createUserBankIfNeeded, audiusBackendInstance, {
      mint: localStorageState.mint,
      feePayerOverride: feePayerAddress,
      recordAnalytics: track
    })

    // Get swappable salvage amount
    const minRent = yield* call(
      [connection, connection.getMinimumBalanceForRentExemption],
      0
    )
    const balance = yield* call(
      [connection, connection.getBalance],
      wallet.publicKey
    )
    // Cap the swappable salvage amount by the intended lamports, in case
    // there's additional SOL for a different reason (eg. old BuyAudio recovery)
    const salvageInputAmount = intendedLamports
      ? Math.min(balance - minRent, intendedLamports)
      : balance - minRent

    // Don't do anything if we don't have any SOL.
    // Don't clear local storage either - maybe the SOL hasn't gotten to us yet?
    if (salvageInputAmount <= 0) {
      throw new BuyCryptoError(
        BuyCryptoErrorCode.BAD_AMOUNT,
        `Buy Crypto via SOL Recovery flow initiated, but no SOL in root wallet: ${wallet.publicKey.toBase58()}`
      )
    }

    // Get pre swap token balance
    const account = yield* call(getTokenAccountInfo, sdk, {
      tokenAccount: userbank
    })

    // Get a quote for swapping the entire balance
    const exactInQuote = yield* call(quoteWithAnalytics, {
      quoteArgs: {
        inputMint: TOKEN_LISTING_MAP.SOL.address,
        outputMint: TOKEN_LISTING_MAP.USDC.address,
        amount: salvageInputAmount,
        swapMode: 'ExactIn',
        slippageBps: config.slippageBps
      },
      track,
      make
    })

    // Do the swap. Just do it once, slippage shouldn't be a
    // concern since the quote is fresh and the tolerance is high.
    const { res, error: recoveryError } = yield* call(swapSolForCrypto, {
      quoteResponse: exactInQuote,
      mint,
      wallet,
      userbank,
      feePayer
    })

    // Check response
    yield* call(assertRecoverySuccess, {
      res,
      swapError: null,
      recoveryError,
      mint
    })

    // Get the token difference
    const initialBalance = account?.amount ?? BigInt(0)
    const newBalance = yield* call(
      pollForTokenBalanceChange,
      audiusBackendInstance,
      {
        initialBalance,
        tokenAccount: userbank,
        mint,
        retryDelayMs: config.retryDelayMs,
        maxRetryCount: config.maxRetryCount
      }
    )
    const balanceChange = newBalance - initialBalance

    // Report to the console what we got
    console.info(
      `Salvaged ${
        exactInQuote.inAmount
      } SOL into ${balanceChange} ${mint.toUpperCase()} (expected: ${expectedAmount} ${mint.toUpperCase()}): ${res}`
    )

    // Check if it's enough
    if (balanceChange === undefined || balanceChange < expectedAmount) {
      throw new BuyCryptoError(
        BuyCryptoErrorCode.INSUFFICIENT_FUNDS_ERROR,
        `Failed to swap SOL to ${expectedAmount} ${mint.toUpperCase()}. Initial Swap Error: Unknown.`
      )
    }

    // Record success
    yield* put(buyCryptoRecoverySucceeded())
    yield* call(
      track,
      make({
        eventName: Name.BUY_CRYPTO_RECOVERY_SUCCESS,
        mint,
        provider,
        intendedSOL: intendedLamports / LAMPORTS_PER_SOL,
        requestedAmount: amount
      })
    )
  } catch (e) {
    const error =
      e instanceof BuyCryptoError
        ? e
        : new BuyCryptoError(BuyCryptoErrorCode.UNKNOWN, `${e}`)

    // Replace the local storage key so we can try again later
    // Don't retry if the SOL was swapped away already
    if (error.code !== BuyCryptoErrorCode.INSUFFICIENT_FUNDS_ERROR) {
      const isExpired = Date.now() - createdAt > LOCAL_STORAGE_STATE_TTL_MS
      // Only continue to retry if within 2 hours from initial attempt
      // This makes sure we don't wait for SOL to arrive forever
      if (!isExpired) {
        yield* call(
          [audiusLocalStorage, audiusLocalStorage.setJSONValue],
          BUY_CRYPTO_VIA_SOL_STATE_KEY,
          localStorageState
        )
      } else {
        console.warn('BuyCrypto recovery expired. Will not reattempt.')
      }
    }

    yield* call(
      track,
      make({
        eventName: Name.BUY_CRYPTO_RECOVERY_FAILURE,
        mint,
        provider,
        requestedAmount: amount,
        intendedSOL: intendedLamports / LAMPORTS_PER_SOL,
        error: error.message
      })
    )
    yield* put(buyCryptoRecoveryFailed({ error }))
    yield* call(reportToSentry, {
      level: ErrorLevel.Error,
      error,
      additionalInfo: {
        wallet: wallet.publicKey.toBase58(),
        userbank: userbank?.toBase58()
      }
    })
  }
}

// Only one purchase at a time
function* watchBuyCryptoViaSol() {
  yield* takeLatest(buyCryptoViaSol, doBuyCryptoViaSol)
}

export default function sagas() {
  return [watchBuyCryptoViaSol, recoverBuyCryptoViaSolIfNecessary]
}
