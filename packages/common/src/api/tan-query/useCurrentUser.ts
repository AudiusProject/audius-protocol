import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { accountFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { getWalletAddresses } from '~/store/account/selectors'

import { QUERY_KEYS } from './queryKeys'
import { Config } from './types'

/**
 * Hook to get the currently logged in user's data
 */
export const useCurrentUser = (config?: Config) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { currentUser } = useSelector(getWalletAddresses)

  return useQuery({
    queryKey: [QUERY_KEYS.accountUser, currentUser],
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
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!currentUser
  })
}
