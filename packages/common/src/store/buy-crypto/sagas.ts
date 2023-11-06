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

import { Name } from 'models/Analytics'
import { ErrorLevel } from 'models/ErrorReporting'
import {
  SLIPPAGE_TOLERANCE_EXCEEDED_ERROR,
  jupiterInstance,
  parseJupiterInstruction
} from 'services/Jupiter'
import {
  MEMO_PROGRAM_ID,
  MintName,
  createUserBankIfNeeded,
  createVersionedTransaction,
  getBalanceChanges,
  getRootSolanaAccount,
  getSolanaConnection,
  pollForBalanceChange,
  pollForTransaction,
  relayVersionedTransaction
} from 'services/audius-backend/solana'
import { IntKeys } from 'services/remote-config/types'
import {
  onrampCanceled,
  onrampFailed,
  onrampSucceeded,
  buyCryptoViaSol,
  buyCryptoCanceled,
  buyCryptoFailed,
  buyCryptoSucceeded
} from 'store/buy-crypto/slice'
import { getBuyUSDCRemoteConfig } from 'store/buy-usdc'
import { getContext } from 'store/commonStore'
import { getFeePayer } from 'store/solana/selectors'
import { TOKEN_LISTING_MAP } from 'store/ui/buy-audio/constants'
import { BuyAudioStage, OnRampProvider } from 'store/ui/buy-audio/types'
import { setVisibility } from 'store/ui/modals/parentSlice'
import { initializeStripeModal } from 'store/ui/stripe-modal/slice'

import { BuyCryptoConfig, BuyCryptoError, BuyCryptoErrorCode } from './types'

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
  const { transaction, addressLookupTableAccounts } = yield* call(
    createVersionedTransaction,
    audiusBackendInstance,
    {
      instructions,
      lookupTableAddresses: addressLookupTableAddresses,
      feePayer
    }
  )
  transaction.sign([wallet])

  return yield* call(relayVersionedTransaction, audiusBackendInstance, {
    transaction,
    addressLookupTableAccounts,
    skipPreflight: true
  })
}

/**
 * Gets the balance changes of the relevant accounts for a swap transaction
 */
function* getSwapSolForCryptoResult({
  transactionSignature,
  sourceWallet,
  destinationTokenAccount
}: {
  transactionSignature: string
  sourceWallet: PublicKey
  destinationTokenAccount: PublicKey
}) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const transactionResponse = yield* call(
    pollForTransaction,
    audiusBackendInstance,
    transactionSignature,
    {
      maxSupportedTransactionVersion: 0
    }
  )
  if (!transactionResponse) {
    return {}
  }

  const { balanceChanges, tokenBalanceChanges } =
    getBalanceChanges(transactionResponse)

  return {
    balanceChange: balanceChanges[sourceWallet.toBase58()],
    outputTokenChange: tokenBalanceChanges[destinationTokenAccount.toBase58()]
  }
}

function* doBuyCryptoViaSol({
  payload: { amount, mint, provider }
}: ReturnType<typeof buyCryptoViaSol>) {
  // Pull from context
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const { track, make } = yield* getContext('analytics')
  const reportToSentry = yield* getContext('reportToSentry')

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
    const quoteResponse = yield* call(
      [jupiterInstance, jupiterInstance.quoteGet],
      {
        inputMint: TOKEN_LISTING_MAP.SOL.address,
        outputMint: outputToken.address,
        amount: Math.ceil(amount * outputTokenLamports),
        swapMode: 'ExactOut',
        slippageBps: config.slippageBps
      }
    )
    const connection = yield* call(getSolanaConnection, audiusBackendInstance)
    const minRent = yield* call(
      [connection, connection.getMinimumBalanceForRentExemption],
      0
    )
    // otherAmountThreshold is the max input amount for the given slippage.
    // Note: ignores any existing SOL as it should be recovered and swapped into USDC
    const requiredAmount = Number(quoteResponse.otherAmountThreshold) + minRent

    // Get min stripe purchase amount using USDC as quote for $1
    const minQuote = yield* call([jupiterInstance, jupiterInstance.quoteGet], {
      inputMint: TOKEN_LISTING_MAP.SOL.address,
      outputMint: TOKEN_LISTING_MAP.USDC.address,
      amount: 1 * 10 ** TOKEN_LISTING_MAP.USDC.decimals,
      swapMode: 'ExactOut',
      slippageBps: config.slippageBps
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
        onrampCanceled,
        onrampFailed,
        onrampSucceeded
      })
    )
    yield* put(setVisibility({ modal: 'StripeOnRamp', visible: true }))

    // TODO: Make unified BuyCrypto analytics?
    yield* call(
      track,
      make({
        eventName:
          mint === 'audio'
            ? Name.BUY_AUDIO_ON_RAMP_OPENED
            : Name.BUY_USDC_ON_RAMP_OPENED,
        provider
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
          eventName:
            mint === 'audio'
              ? Name.BUY_AUDIO_ON_RAMP_CANCELED
              : Name.BUY_USDC_ON_RAMP_CANCELED,
          provider
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
          eventName:
            mint === 'audio'
              ? Name.BUY_AUDIO_ON_RAMP_CANCELED
              : Name.BUY_USDC_ON_RAMP_FAILURE,
          provider,
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

    // Record analytics
    yield* call(
      track,
      make({
        eventName:
          mint === 'audio'
            ? Name.BUY_AUDIO_ON_RAMP_SUCCESS
            : Name.BUY_USDC_ON_RAMP_SUCCESS,
        provider
      })
    )

    // Wait for the funds to come through
    const newBalance = yield* call(
      pollForBalanceChange,
      audiusBackendInstance,
      {
        wallet: wallet.publicKey,
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

    // Try the swap a few times in hopes the price comes back if it slipped
    let swapError = null
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
      // Get the amount to swap using the new balance less the min required for rent
      // Note: This disregards the existing SOL balance, but there shouldn't be any
      const newBalance = yield* call(
        [connection, connection.getBalance],
        wallet.publicKey
      )
      const salvageInputAmount = newBalance - minRent

      // Get a quote for swapping the entire balance
      const exactInQuote = yield* call(
        [jupiterInstance, jupiterInstance.quoteGet],
        {
          inputMint: TOKEN_LISTING_MAP.SOL.address,
          outputMint: TOKEN_LISTING_MAP.USDC.address,
          amount: salvageInputAmount,
          swapMode: 'ExactIn',
          slippageBps: config.slippageBps
        }
      )

      // Do the swap. Just do it once, slippage shouldn't be a
      // concern since the quote is fresh and the tolerance is high.
      const { res, error: recoveryError } = yield* call(swapSolForCrypto, {
        quoteResponse: exactInQuote,
        mint,
        wallet,
        userbank,
        feePayer
      })
      if (recoveryError) {
        throw new BuyCryptoError(
          BuyCryptoErrorCode.SWAP_ERROR,
          `Failed to recover ${mint.toUpperCase()} from SOL: ${recoveryError}. Initial Swap Error: ${swapError}`
        )
      } else if (res) {
        // Read the results of the swap from the transaction
        const { balanceChange, outputTokenChange } = yield* call(
          getSwapSolForCryptoResult,
          {
            transactionSignature: res,
            sourceWallet: wallet.publicKey,
            destinationTokenAccount: userbank
          }
        )
        console.info(
          `Salvaged ${
            balanceChange === undefined ? '?' : Math.abs(balanceChange)
          } SOL into ${outputTokenChange ?? '?'} ${mint.toUpperCase()}: ${res}`
        )

        // TODO: Some UI here?

        // Even though we recovered some USDC, bubble the initial error as a
        // failure if the amount salvaged wasn't enough
        if (
          outputTokenChange === undefined ||
          outputTokenChange < BigInt(quoteResponse.outAmount)
        ) {
          throw new BuyCryptoError(
            BuyCryptoErrorCode.SWAP_ERROR,
            `Failed to swap SOL to ${mint.toUpperCase()}: ${swapError}`
          )
        }
      } else {
        throw new BuyCryptoError(
          BuyCryptoErrorCode.UNKNOWN,
          'Unknown error during recovery swap'
        )
      }
    } else if (swapTransactionSignature) {
      // Read the results of the swap from the transaction
      const { balanceChange, outputTokenChange } = yield* call(
        getSwapSolForCryptoResult,
        {
          transactionSignature: swapTransactionSignature,
          sourceWallet: wallet.publicKey,
          destinationTokenAccount: userbank
        }
      )
      console.info(
        `Succesfully swapped ${
          balanceChange === undefined ? '?' : Math.abs(balanceChange)
        } SOL into ${
          outputTokenChange ?? '?'
        } ${mint.toUpperCase()}: ${swapTransactionSignature}`
      )
    } else {
      throw new BuyCryptoError(
        BuyCryptoErrorCode.UNKNOWN,
        'Unknown error during initial swap'
      )
    }

    // Record success
    if (mint === 'audio') {
      yield* call(
        track,
        make({
          eventName: Name.BUY_AUDIO_SUCCESS,
          provider,
          requestedAudio: amount,
          surplusAudio:
            amount - Number(quoteResponse.outAmount) / outputTokenLamports,
          actualAudio: Number(quoteResponse.outAmount) / outputTokenLamports
        })
      )
    } else if (mint === 'usdc') {
      yield* call(
        track,
        make({
          eventName: Name.BUY_USDC_SUCCESS,
          provider,
          requestedAmount: amount
        })
      )
    }
    yield* put(buyCryptoSucceeded())
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
    if (mint === 'audio') {
      yield* call(
        track,
        make({
          eventName: Name.BUY_AUDIO_FAILURE,
          provider,
          requestedAudio: amount,
          error: error.message,
          stage: BuyAudioStage.START
        })
      )
    } else if (mint === 'usdc') {
      yield* call(
        track,
        make({
          eventName: Name.BUY_USDC_FAILURE,
          provider,
          requestedAmount: amount,
          error: error.message
        })
      )
    }
  }
}

// Only one purchase at a time
function* watchBuyCrypto() {
  yield* takeLatest(buyCryptoViaSol, doBuyCryptoViaSol)
}

export default function sagas() {
  return [watchBuyCrypto]
}
