import type { AudiusSdk, full } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { call } from 'typed-redux-saga'

import { accountFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { SolanaWalletAddress } from '~/models/Wallet'
import { getWalletAddresses } from '~/store/account/selectors'
import { getContext } from '~/store/effects'
import { getSDK } from '~/store/sdkUtils'
import { isResponseError } from '~/utils/error'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'

const fetchAccount = async (
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

/**
 * Saga-compatible version of fetching an account by wallet.
 */
export function* fetchAccountSaga(
  args: full.GetUserAccountRequest,
  options?: Config
) {
  const queryClient = yield* getContext('queryClient')
  const sdk = yield* getSDK()

  const result: Awaited<ReturnType<typeof fetchAccount>> = yield* call(
    async () =>
      queryClient.fetchQuery({
        queryKey: [QUERY_KEYS.accountUser, args.wallet],
        queryFn: async () => fetchAccount(args, { sdk }),
        // Don't refetch on new mounts by default
        staleTime: options?.staleTime ?? Infinity
      })
  )
  return result
}

/**
 * Hook to get the full account info for the current user
 */
export const useAccount = (options?: Config) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { currentUser } = useSelector(getWalletAddresses)

  return useQuery({
    queryKey: [QUERY_KEYS.accountUser, currentUser],
    queryFn: async () =>
      fetchAccount({ wallet: currentUser! }, { sdk: await audiusSdk() }),
    // Don't refetch on new mounts by default
    staleTime: options?.staleTime ?? Infinity,
    enabled: options?.enabled !== false && !!currentUser
  })
}

/**
 * Hook to get the current user's metadata
 */
export const useCurrentUser = (options?: Config) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { currentUser } = useSelector(getWalletAddresses)

  return useQuery({
    queryKey: [QUERY_KEYS.accountUser, currentUser],
    queryFn: async () =>
      fetchAccount({ wallet: currentUser! }, { sdk: await audiusSdk() }),
    // Don't refetch on new mounts by default
    staleTime: options?.staleTime ?? Infinity,
    enabled: options?.enabled !== false && !!currentUser,
    select: (data) => data?.user ?? null
  })
}

/**
 * Hook to get the current user's playlist library
 */
export const usePlaylistLibrary = (options?: Config) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { currentUser } = useSelector(getWalletAddresses)

  return useQuery({
    queryKey: [QUERY_KEYS.accountUser, currentUser],
    queryFn: async () =>
      fetchAccount({ wallet: currentUser! }, { sdk: await audiusSdk() }),
    // Don't refetch on new mounts by default
    staleTime: options?.staleTime ?? Infinity,
    enabled: options?.enabled !== false && !!currentUser,
    select: (data) => data?.playlist_library ?? null
  })
}

/**
 * Hook to get the current web3User (logged in user), which may be different from
 * the current acting user if we're in manager mode.
 */
export const useGetCurrentWeb3User = (options?: Config) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { web3User } = useSelector(getWalletAddresses)

  const result = useQuery({
    queryKey: [QUERY_KEYS.accountUser, web3User],
    queryFn: async () =>
      fetchAccount({ wallet: web3User! }, { sdk: await audiusSdk() }),
    // Don't refetch on new mounts by default
    staleTime: options?.staleTime ?? Infinity,
    enabled: options?.enabled !== false && !!web3User
  })

  return { ...result, data: result.data ? result.data.user : null }
}
