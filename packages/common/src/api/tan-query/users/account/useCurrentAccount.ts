import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { accountFromSDK } from '~/adapters/user'
import { useQueryContext } from '~/api/tan-query/utils'
import { useAppContext } from '~/context/appContext'
import { ID } from '~/models/Identifiers'
import { AccountUserMetadata } from '~/models/User'
import { getWalletAddresses } from '~/store/account/selectors'

import { QUERY_KEYS } from '../../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../../types'

import { useCurrentUserId } from './useCurrentUserId'

export const getCurrentAccountQueryKey = (
  currentUserId: ID | null | undefined
) =>
  [
    QUERY_KEYS.accountUser,
    currentUserId
  ] as unknown as QueryKey<AccountUserMetadata>

export enum CurrentUserWalletType {
  currentUser = 'currentUser',
  web3User = 'web3User'
}

/**
 * Hook to get the currently logged in user's account
 */
export const useCurrentAccount = <
  TResult = AccountUserMetadata | null | undefined
>(
  walletType: CurrentUserWalletType = CurrentUserWalletType.currentUser,
  options?: SelectableQueryOptions<
    AccountUserMetadata | null | undefined,
    TResult
  >
) => {
  const { audiusSdk } = useQueryContext()
  const walletAddresses = useSelector(getWalletAddresses)
  const currentUserWallet = walletAddresses[walletType]
  const { data: currentUserId } = useCurrentUserId()
  const { localStorage } = useAppContext()

  return useQuery({
    queryKey: getCurrentAccountQueryKey(currentUserId),
    queryFn: async () => {
      const sdk = await audiusSdk()
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
    },
    staleTime: options?.staleTime ?? Infinity,
    gcTime: Infinity,
    enabled: options?.enabled !== false && !!currentUserWallet,
    ...options
  })
}
