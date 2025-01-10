import type { AudiusSdk, full } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { accountFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { SolanaWalletAddress } from '~/models/Wallet'
import { getWalletAddresses } from '~/store/account/selectors'
import { isResponseError } from '~/utils/error'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'

export const fetchAccount = async (
  args: full.GetUserAccountRequest,
  { sdk }: { sdk: AudiusSdk }
) => {
  try {
    const { data } = await sdk.full.users.getUserAccount(args)
    if (!data) {
      console.warn('Missing user from account response')
      return null
    }

    const account = accountFromSDK(data)
    // If we got a valid account, populate user bank since that's
    // expected to exist on "account" users
    if (account) {
      const userBank = await sdk.services.claimableTokensClient.deriveUserBank({
        ethWallet: args.wallet,
        mint: 'wAUDIO'
      })
      account.user.userBank = userBank.toString() as SolanaWalletAddress
    }
    return account ?? null
  } catch (e) {
    // Account doesn't exist, don't bubble up an error, just return null
    if (isResponseError(e) && [401, 404].includes(e.response.status)) {
      return null
    }
    throw e
  }
}

export const useAccount = (config?: Config) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { currentUser } = useSelector(getWalletAddresses)

  return useQuery({
    queryKey: [QUERY_KEYS.accountUser, currentUser],
    queryFn: async () =>
      fetchAccount({ wallet: currentUser! }, { sdk: await audiusSdk() }),
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!currentUser
  })
}

/**
 * Hook to get the currently logged in user's data
 */
export const useCurrentUser = (config?: Config) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { currentUser } = useSelector(getWalletAddresses)

  return useQuery({
    queryKey: [QUERY_KEYS.accountUser, currentUser],
    queryFn: async () =>
      fetchAccount({ wallet: currentUser! }, { sdk: await audiusSdk() }),
    // Don't refetch on new mounts by default
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!currentUser,
    select: (data) => data?.user ?? null
  })
}

// TODO-NOW: These still trigger fetches even though the account fetch has been done?
// Thought staleTime was per query key...
export const usePlaylistLibrary = (config?: Config) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { currentUser } = useSelector(getWalletAddresses)

  return useQuery({
    queryKey: [QUERY_KEYS.accountUser, currentUser],
    queryFn: async () =>
      fetchAccount({ wallet: currentUser! }, { sdk: await audiusSdk() }),
    // Don't refetch on new mounts by default
    staleTime: config?.staleTime ?? Infinity,
    enabled: config?.enabled !== false && !!currentUser,
    select: (data) => data?.playlist_library ?? null
  })
}
