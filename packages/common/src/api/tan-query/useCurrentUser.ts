import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { accountFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { UserMetadata } from '~/models/User'
import { getWalletAddresses } from '~/store/account/selectors'

import { QUERY_KEYS } from './queryKeys'
import { SelectableQueryOptions } from './types'

export const getCurrentUserQueryKey = (
  currentUser: string | null | undefined
) => [QUERY_KEYS.accountUser, currentUser] as const

/**
 * Hook to get the currently logged in user's data
 */
export const useCurrentUser = <TResult = UserMetadata | null | undefined>(
  options?: SelectableQueryOptions<UserMetadata | null | undefined, TResult>
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { currentUser } = useSelector(getWalletAddresses)

  return useQuery({
    queryKey: getCurrentUserQueryKey(currentUser),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const { data } = await sdk.full.users.getUserAccount({
        wallet: currentUser!
      })

      if (!data) {
        console.warn('Missing user from account response')
        return null
      }

      const account = accountFromSDK(data)
      return account?.user
    },
    ...options,
    enabled: options?.enabled !== false && !!currentUser
  })
}
