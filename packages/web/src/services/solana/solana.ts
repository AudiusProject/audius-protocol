import { SolanaWalletAddress } from '@audius/common/models'
import { getAccount } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'

import { audiusSdk } from 'services/audius-sdk'

const ROOT_ACCOUNT_SIZE = 0 // Root account takes 0 bytes, but still pays rent!
export const TRANSACTION_FEE_FALLBACK = 10000

export const getSolanaConnection = async () => {
  const sdk = await audiusSdk()
  return sdk.services.solanaClient.connection
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
