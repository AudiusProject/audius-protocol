import { SolanaWalletAddress } from '@audius/common/models'
import { DEFAULT_MINT, MintName } from '@audius/common/services'
import {
  Account,
  getMinimumBalanceForRentExemptAccount,
  getAssociatedTokenAddressSync,
  getAccount
} from '@solana/spl-token'
import { PublicKey, Transaction, Keypair } from '@solana/web3.js'

import { getLibs } from 'services/audius-libs'
import { audiusSdk } from 'services/audius-sdk'

export const ROOT_ACCOUNT_SIZE = 0 // Root account takes 0 bytes, but still pays rent!
export const TRANSACTION_FEE_FALLBACK = 10000

export const getSolanaConnection = async () => {
  const sdk = await audiusSdk()
  return sdk.services.solanaClient.connection
}

/**
 * Checks if the given address is a solana address vs an associated token account.
 */
export const isSolWallet = async (destinationWallet: SolanaWalletAddress) => {
  try {
    const destination = new PublicKey(destinationWallet)
    return PublicKey.isOnCurve(destination.toBytes())
  } catch (err) {
    console.error(err)
    return false
  }
}

/**
 * Checks if the given account address is an associated token account
 */
export const isTokenAccount = async ({
  accountAddress,
  mint
}: {
  accountAddress: SolanaWalletAddress
  mint: MintName
}) => {
  const info = await getTokenAccountInfo({
    tokenAccount: new PublicKey(accountAddress),
    mint
  })
  return info !== null
}

/**
 * Gets the current user's root solana account.
 */
export const getRootSolanaAccount = async () => {
  const libs = await getLibs()
  return Keypair.fromSeed(libs.Account!.hedgehog.wallet!.getPrivateKey())
}

/**
 * Checks whether the input address is a valid solana address.
 */
export const isValidSolAddress = async (address: SolanaWalletAddress) => {
  try {
    // @ts-ignore - need an unused variable to check if the destinationWallet is valid
    const ignored = new PublicKey(address)
    return true
  } catch (err) {
    console.debug(err)
    return false
  }
}

/**
 * Calculates the minimum amount of rent needed for a solana account to be
 * rent-exempt.
 */
export const getRootAccountRentExemptionMinimum = async () => {
  const connection = await getSolanaConnection()
  return await connection.getMinimumBalanceForRentExemption(
    ROOT_ACCOUNT_SIZE,
    'processed'
  )
}

/**
 * Gets the token account info for a given token account.
 */
export const getTokenAccountInfo = async ({
  tokenAccount,
  mint = DEFAULT_MINT
}: {
  tokenAccount: PublicKey
  mint?: MintName
}): Promise<Account | null> => {
  const libs = await getLibs()
  return await libs.solanaWeb3Manager!.getTokenAccountInfo(
    tokenAccount.toString()
  )
}

/**
 * Gets the recent blockhash.
 */
export const getRecentBlockhash = async () => {
  const connection = await getSolanaConnection()
  return (await connection.getLatestBlockhash()).blockhash
}

/**
 * Gets the fee for a transfer transaction.
 */
export const getTransferTransactionFee = async (
  destinationPubkey: PublicKey
) => {
  const connection = await getSolanaConnection()
  const recentBlockhash = await getRecentBlockhash()
  const tx = new Transaction()
  tx.recentBlockhash = recentBlockhash
  tx.feePayer = destinationPubkey
  return (await tx.getEstimatedFee(connection)) ?? TRANSACTION_FEE_FALLBACK
}

/**
 * Calculates the rent for an associated token account.
 */
export const getAssociatedTokenAccountRent = async () => {
  const connection = await getSolanaConnection()
  return await getMinimumBalanceForRentExemptAccount(connection)
}

/**
 * Returns the associated USDC token account for the given solana account.
 */
export const getUSDCAssociatedTokenAccount = async (
  solanaRootAccountPubkey: PublicKey
) => {
  const libs = await getLibs()
  return getAssociatedTokenAddressSync(
    libs.solanaWeb3Manager!.mints.usdc,
    solanaRootAccountPubkey
  )
}

/**
 * Returns the owner of the token acccount, if the provided account
 * is a token account. Otherwise, just returns the account
 */
export const getAssociatedTokenAccountOwner = async (
  accountAddress: SolanaWalletAddress
) => {
  const connection = await getSolanaConnection()
  const { owner } = await getAccount(connection, new PublicKey(accountAddress))
  return owner
}

/**
 * Returns the current user's USDC user bank.
 */
export const getUSDCUserBank = async (ethAddress: string) => {
  const sdk = await audiusSdk()
  const usdcUserBank = await sdk.services.claimableTokensClient.deriveUserBank({
    ethWallet: ethAddress,
    mint: 'USDC'
  })
  return usdcUserBank
}
