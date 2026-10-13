import { SolanaWalletAddress } from '@audius/common/models'
import { getAccount } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'

import { audiusSdk } from 'services/audius-sdk'

const getSolanaConnection = async () => {
  const sdk = await audiusSdk()
  return await sdk.services.solanaClient.getConnection()
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
