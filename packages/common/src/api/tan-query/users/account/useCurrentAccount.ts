import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { accountFromSDK } from '~/adapters/user'
import { useQueryContext } from '~/api/tan-query/utils'
import { useAppContext } from '~/context/appContext'
import { AccountUserMetadata } from '~/models/User'
import { getWalletAddresses } from '~/store/account/selectors'

import { QUERY_KEYS } from '../../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../../types'

export const getCurrentAccountQueryKey = () =>
  [QUERY_KEYS.accountUser] as unknown as QueryKey<AccountUserMetadata>

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

  // We intentionally cache account data in local storage to quickly render the account details
  // This initialData primes our query slice up front and will cause the hook to return synchronously (if the data exists)
  const initialData = useMemo(() => {
    const localAccount = localStorage.getAudiusAccountSync?.() // Assume you implement a sync version
    const localAccountUser = localStorage.getAudiusAccountUserSync?.()

    if (localAccount && localAccountUser) {
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

    return undefined
  }, [localStorage])

  return useQuery({
    queryKey: getCurrentAccountQueryKey(),
    queryFn: async () => {
      // this means unauthenticated user
      if (!currentUserWallet) {
        return null
      }

      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getUserAccount({
        wallet: currentUserWallet!
      })

      if (!data) {
        console.warn('Missing user from account response')
        return null
      }

      const account = accountFromSDK(data)
      return account
    },
    staleTime: options?.staleTime ?? Infinity,
    gcTime: Infinity,
    enabled: options?.enabled !== false && !!currentUserWallet,
    initialData: initialData ?? undefined,
    ...options
  })
}
