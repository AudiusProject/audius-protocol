import { useMemo } from 'react'

import { AudiusSdk } from '@audius/sdk'
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { AnyAction, Dispatch } from 'redux'

import { accountFromSDK } from '~/adapters/user'
import { primeUserData, useQueryContext } from '~/api/tan-query/utils'
import { useAppContext } from '~/context/appContext'
import { Status } from '~/models'
import { AccountUserMetadata, User, UserMetadata } from '~/models/User'
import { LocalStorage } from '~/services'
import { AccountState } from '~/store'
import { getWalletAddresses } from '~/store/account/selectors'

import { QUERY_KEYS } from '../../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../../types'
import { useUser } from '../useUser'

export const getCurrentAccountQueryKey = () =>
  [QUERY_KEYS.accountUser] as unknown as QueryKey<AccountState>

const getLocalAccount = (localStorage: LocalStorage) => {
  const localAccount = localStorage.getAudiusAccountSync?.()
  const localAccountUser =
    localStorage.getAudiusAccountUserSync?.() as UserMetadata
  if (localAccount && localAccountUser) {
    // feature-tan-query TODO: when removing account sagas,
    //    need to add wallets and local account user from local storage
    return {
      collections: localAccount.collections,
      userId: localAccountUser.user_id,
      hasTracks: localAccountUser.track_count > 0,
      status: Status.SUCCESS,
      reason: null,
      connectivityFailure: false,
      needsAccountRecovery: false,
      walletAddresses: { currentUser: null, web3User: null },
      playlistLibrary: localAccount.playlistLibrary ?? null,
      trackSaveCount: localAccount.trackSaveCount,
      guestEmail: null
    } as AccountState
  }
  return undefined
}

export const getCurrentAccountQueryFn = async (
  sdk: AudiusSdk,
  localStorage: LocalStorage,
  currentUserWallet: string | null,
  queryClient: QueryClient,
  dispatch: Dispatch<AnyAction>
): Promise<AccountState | null | undefined> => {
  const localAccount = getLocalAccount(localStorage)
  if (localAccount) {
    return localAccount
  }

  const { data } = await sdk.full.users.getUserAccount({
    wallet: currentUserWallet!
  })

  if (!data) {
    console.warn('Missing user from account response')
    return null
  }

  const account = accountFromSDK(data)

  if (account) {
    primeUserData({ users: [account.user], queryClient, dispatch })
  }

  return {
    collections: account?.playlists,
    userId: account?.user?.user_id,
    hasTracks: (account?.user?.track_count ?? 0) > 0,
    status: Status.SUCCESS,
    reason: null,
    connectivityFailure: false,
    needsAccountRecovery: false,
    walletAddresses: { currentUser: null, web3User: null },
    playlistLibrary: account?.playlist_library ?? null,
    trackSaveCount: account?.track_save_count ?? null,
    guestEmail: null
  } as AccountState
}

/**
 * Hook to get the currently logged in user's account
 */
export const useCurrentAccount = <TResult = AccountState | null | undefined>(
  options?: SelectableQueryOptions<AccountState | null | undefined, TResult>
) => {
  const { audiusSdk } = useQueryContext()
  const walletAddresses = useSelector(getWalletAddresses)
  const currentUserWallet = walletAddresses.currentUser
  const { localStorage } = useAppContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  // We intentionally cache account data in local storage to quickly render the account details
  // This initialData primes our query slice up front and will cause the hook to return synchronously (if the data exists)
  const initialData = useMemo(
    () => getLocalAccount(localStorage),
    [localStorage]
  )

  return useQuery({
    queryKey: getCurrentAccountQueryKey(),
    queryFn: async () =>
      getCurrentAccountQueryFn(
        await audiusSdk(),
        localStorage,
        currentUserWallet,
        queryClient,
        dispatch
      ),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: options?.enabled !== false && !!currentUserWallet,
    initialData: initialData ?? undefined,
    ...options
  })
}

export const useCurrentAccountUser = <TResult = User>(
  options?: SelectableQueryOptions<User, TResult>
) => {
  const { data: currentAccount } = useCurrentAccount()
  return useUser(currentAccount?.userId, options)
}

/**
 * Some helper utils that can be used to pass into the select option
 */
export const selectIsGuestAccount = (
  data?: AccountUserMetadata | UserMetadata | null
) => {
  const user = data && 'user' in data ? data?.user : data
  return Boolean(!user?.handle && !user?.name)
}

export const selectAccountHasTracks = (
  data?: AccountUserMetadata | UserMetadata | null
) => {
  const user = data && 'user' in data ? data?.user : data
  return (user?.track_count ?? 0) > 0
}

export const selectHasAccount = (
  data?: AccountUserMetadata | UserMetadata | null
) => {
  const user = data && 'user' in data ? data?.user : data
  return Boolean(user?.handle && user?.name)
}
