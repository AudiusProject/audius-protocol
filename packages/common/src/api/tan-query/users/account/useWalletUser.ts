import { AudiusSdk } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { accountFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { AccountUserMetadata, UserMetadata } from '~/models/User'
import { getWalletAddresses } from '~/store/account/selectors'

import { QUERY_KEYS } from '../../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../../types'

export const getWalletAccountQueryKey = (wallet: string | null | undefined) =>
  [
    QUERY_KEYS.walletAccount,
    wallet
  ] as unknown as QueryKey<AccountUserMetadata | null>

export const getWalletUserQueryKey = (wallet: string | null | undefined) =>
  [QUERY_KEYS.walletUser, wallet] as unknown as QueryKey<UserMetadata | null>

// This queryFn is separate in order to be used in sagas
export const getWalletAccountQueryFn = async (
  wallet: string,
  sdk: AudiusSdk
) => {
  const { data } = await sdk.full.users.getUserAccount({
    wallet
  })

  if (!data) {
    console.warn('Missing user from account response')
    return null
  }

  const account = accountFromSDK(data)
  return account
}

/**
 * Hook to get the currently logged in user's data
 */
export const useWalletUser = <TResult = UserMetadata | null | undefined>(
  options?: SelectableQueryOptions<UserMetadata | null | undefined, TResult>
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { currentUser: currentUserWallet } = useSelector(getWalletAddresses)

  return useQuery({
    queryKey: getWalletUserQueryKey(currentUserWallet),
    queryFn: async () => {
      const sdk = await audiusSdk()
      return (await getWalletAccountQueryFn(currentUserWallet!, sdk))?.user
    },
    ...options,
    enabled: options?.enabled !== false && !!currentUserWallet
  })
}
