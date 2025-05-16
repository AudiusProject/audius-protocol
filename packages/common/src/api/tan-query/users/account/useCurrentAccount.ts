import { AudiusSdk } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { accountFromSDK } from '~/adapters/user'
import { useQueryContext } from '~/api/tan-query/utils'
import { useAppContext } from '~/context/appContext'
import { AccountUserMetadata, UserMetadata } from '~/models/User'
import { getWalletAddresses } from '~/store/account/selectors'

import { QUERY_KEYS } from '../../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../../types'

export const getCurrentAccountQueryKey = () =>
  [QUERY_KEYS.accountUser] as unknown as QueryKey<AccountUserMetadata>

export const getCurrentAccountQueryFn = async (
  sdk: AudiusSdk,
  localStorage: any,
  currentUserWallet: string | null
): Promise<AccountUserMetadata | null | undefined> => {
  const localAccount = await localStorage.getAudiusAccount()
  const localAccountUser = await localStorage.getAudiusAccountUser()
  if (localAccount && localAccountUser) {
    // feature-tan-query TODO: when removing account sagas,
    //    need to add wallets and local account user from local storage
    const account: AccountUserMetadata = {
      user: {
        ...localAccountUser,
        playlists: localAccount.collections
      },
      playlists: localAccount.collections,
      track_save_count: localAccount.trackSaveCount,
      playlist_library: localAccount.playlistLibrary
    }
    return account
  }
  const { data } = await sdk.full.users.getUserAccount({
    wallet: currentUserWallet!
  })

  if (!data) {
    console.warn('Missing user from account response')
    return null
  }

  const account = accountFromSDK(data)
  return account
}

/**
 * Hook to get the currently logged in user's account
 */
export const useCurrentAccount = <
  TResult = AccountUserMetadata | null | undefined
>(
  options?: SelectableQueryOptions<
    AccountUserMetadata | null | undefined,
    TResult
  >
) => {
  const { audiusSdk } = useQueryContext()
  const walletAddresses = useSelector(getWalletAddresses)
  const currentUserWallet = walletAddresses.currentUser
  const { localStorage } = useAppContext()

  return useQuery({
    queryKey: getCurrentAccountQueryKey(),
    queryFn: async () =>
      getCurrentAccountQueryFn(
        await audiusSdk(),
        localStorage,
        currentUserWallet
      ),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: options?.enabled !== false && !!currentUserWallet,
    ...options
  })
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
