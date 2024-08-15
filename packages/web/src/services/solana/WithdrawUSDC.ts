import {
  getRecentBlockhash,
  getLookupTableAccounts,
  IntKeys,
  BUY_SOL_VIA_TOKEN_SLIPPAGE_BPS,
  FeatureFlags
} from '@audius/common/services'
import {
  createCloseAccountInstruction,
  NATIVE_MINT,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'

import {
  JupiterSingleton,
  parseInstruction
} from 'services/audius-backend/Jupiter'
import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'
import { audiusSdk } from 'services/audius-sdk'
import { env } from 'services/env'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import {
  getAssociatedTokenAccountRent,
  getTransferTransactionFee
} from 'services/solana/solana'

export const getFundDestinationTokenAccountFees = async (
  account: PublicKey
) => {
  const rent = await getAssociatedTokenAccountRent()
  const fee = await getTransferTransactionFee(account)
  return (rent + fee) / LAMPORTS_PER_SOL
}

/**
 * Creates instructions to swap from a user bank token into the given wallet as SOL.
 * These instructions are allowed in relay because every created token account is closed in the same transaction.
 * @deprecated not necessary anymore as we allow users to fund one token account
 */
export const swapUserBankUSDCToSol = async ({
  outSolAmount,
  wallet,
  ethWallet
}: {
  outSolAmount: number
  wallet: Keypair
  ethWallet: string
}) => {
  const sdk = await audiusSdk()
  const claimableTokensClient = sdk.services.claimableTokensClient
  const authService = sdk.services.auth
  const mintName = 'USDC'
  const mint = new PublicKey(env.USDC_MINT_ADDRESS)
  const feePayer = await sdk.services.solanaRelay.getFeePayer()
  const slippageBps =
    remoteConfigInstance.getRemoteVar(
      IntKeys.BUY_SOL_WITH_TOKEN_SLIPPAGE_BPS
    ) ?? BUY_SOL_VIA_TOKEN_SLIPPAGE_BPS

  const walletTokenAccount = getAssociatedTokenAddressSync(
    mint,
    wallet.publicKey
  )
  const walletSolTokenAccount = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    wallet.publicKey
  )
  const tokenSymbol = mintName

  // 1. Create a temporary token account on the wallet
  const createTemporaryTokenAccountInstruction =
    createAssociatedTokenAccountIdempotentInstruction(
      feePayer, // fee payer
      walletTokenAccount, // account to create
      wallet.publicKey, // owner
      mint // mint
    )

  // 2-3. Transfer the tokens from the userbank to the wallet
  // Use ExactOut so we know how much of the token to swap for the outSolAmount
  const quoteRoute = await JupiterSingleton.getQuote({
    inputTokenSymbol: tokenSymbol,
    outputTokenSymbol: 'SOL',
    inputAmount: outSolAmount,
    slippageBps,
    swapMode: 'ExactOut',
    onlyDirectRoutes: true
  })
  // Use the otherAmountThreshold which will account for max slippage.
  // We will end up with potentially extra SOL in the root account.
  const usdcNeededAmount = quoteRoute.otherAmountThreshold.amount
  const secpTransferInstruction =
    await claimableTokensClient.createTransferSecpInstruction({
      auth: authService,
      amount: BigInt(usdcNeededAmount),
      ethWallet,
      mint: mintName,
      destination: walletTokenAccount,
      instructionIndex: 1
    })
  const transferInstruction =
    await claimableTokensClient.createTransferInstruction({
      ethWallet,
      mint: mintName,
      destination: walletTokenAccount
    })

  // 4. Create a temporary wSOL account on the wallet
  const createWSOLInstruction =
    createAssociatedTokenAccountIdempotentInstruction(
      feePayer, // fee payer
      walletSolTokenAccount, // account to create
      wallet.publicKey, // owner
      NATIVE_MINT // mint
    )

  // 5. Swap the tokens for wSOL
  // Use ExactIn to ensure all the USDC tokens get used in the swap.
  // We need to make sure to clear out all of the USDC tokens so that
  // the relayer is happy that the account cannot be drained elsewhere.
  const swapQuote = await JupiterSingleton.getQuote({
    inputTokenSymbol: tokenSymbol,
    outputTokenSymbol: 'SOL',
    inputAmount: usdcNeededAmount / 10 ** 6,
    slippageBps,
    swapMode: 'ExactIn',
    onlyDirectRoutes: true
  })
  // Only get the swap instruction. Don't compute budget for consistent fees,
  // don't use setup/cleanup instructions and instead do those manually since the wallet has no SOL,
  // and we didn't include token ledger so ignore that as well.
  const {
    response: { swapInstruction },
    lookupTableAddresses
  } = await JupiterSingleton.getSwapInstructions({
    quote: swapQuote.quote,
    userPublicKey: wallet.publicKey,
    destinationTokenAccount: walletSolTokenAccount
  })

  // 6. Convert wSOL to SOL by closing the wSOL token account and setting the destination wallet
  const closeWSOLInstruction = createCloseAccountInstruction(
    walletSolTokenAccount, //  account to close
    wallet.publicKey, // fee destination
    wallet.publicKey //  owner
  )

  // 7. Recreate the wSOL account using the wallet so we can return the rent to the feepayer
  const createWSOLInstructionAgain =
    createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey, // fee payer
      walletSolTokenAccount, // account to create
      wallet.publicKey, // owner
      NATIVE_MINT // mint
    )

  // 8. Close the recreated wSOL account, setting the destination to the feepayer so it's refunded
  const closeWSOLInstructionAgain = createCloseAccountInstruction(
    walletSolTokenAccount, //  account to close
    feePayer, // fee destination
    wallet.publicKey //  owner
  )

  // 9. Close the temporary token account on the wallet and return the rent to the feepayer
  const closeTemporaryTokenAccountInstruction = createCloseAccountInstruction(
    walletTokenAccount, //  account to close
    feePayer, // fee destination
    wallet.publicKey //  owner
  )

  const transaction = await sdk.services.solanaClient.buildTransaction({
    instructions: [
      createTemporaryTokenAccountInstruction,
      secpTransferInstruction,
      transferInstruction,
      createWSOLInstruction,
      parseInstruction(swapInstruction),
      closeWSOLInstruction,
      createWSOLInstructionAgain,
      closeWSOLInstructionAgain,
      closeTemporaryTokenAccountInstruction
    ],
    addressLookupTables: lookupTableAddresses.map(
      (address) => new PublicKey(address)
    )
  })

  transaction.sign([wallet])

  const signature = await claimableTokensClient.sendTransaction(transaction, {
    skipPreflight: true
  })

  return {
    signature,
    usdcNeededAmount
  }
}

const extendLookupTableAddresses = (lookupTableAddresses: string[]) => {
  return env.LOOKUP_TABLE_ADDRESS
    ? [...lookupTableAddresses, env.LOOKUP_TABLE_ADDRESS]
    : lookupTableAddresses
}

export const createVersionedTransaction = async ({
  instructions,
  lookupTableAddresses,
  feePayer
}: {
  instructions: TransactionInstruction[]
  lookupTableAddresses: string[]
  feePayer: PublicKey
}) => {
  const lookupAddressesEnabled = remoteConfigInstance.getFeatureEnabled(
    FeatureFlags.USE_ADDRESS_LOOKUPS
  )

  const lookupTableAccounts = await getLookupTableAccounts(
    audiusBackendInstance,
    {
      lookupTableAddresses: lookupAddressesEnabled
        ? extendLookupTableAddresses(lookupTableAddresses)
        : lookupTableAddresses
    }
  )
  const recentBlockhash = await getRecentBlockhash(audiusBackendInstance)

  const message = new TransactionMessage({
    payerKey: feePayer,
    recentBlockhash,
    instructions
  }).compileToV0Message(lookupTableAccounts)
  return {
    transaction: new VersionedTransaction(message),
    lookupTableAccounts
  }
}
