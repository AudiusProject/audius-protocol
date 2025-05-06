import { AudiusSdk } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'

import { accountFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { AccountUserMetadata } from '~/models'

import { QUERY_KEYS } from '../../queryKeys'
import { QueryKey, SelectableQueryOptions } from '../../types'

export const getWalletAccountQueryKey = (wallet: string | null | undefined) =>
  [
    QUERY_KEYS.walletAccount,
    wallet
  ] as unknown as QueryKey<AccountUserMetadata | null>

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
export const useWalletAccount = <
  TResult = AccountUserMetadata | null | undefined
>(
  wallet: string | null | undefined,
  options?: SelectableQueryOptions<
    AccountUserMetadata | null | undefined,
    TResult
  >
) => {
  const { audiusSdk } = useAudiusQueryContext()

  return useQuery({
    queryKey: getWalletAccountQueryKey(wallet),
    queryFn: async () => {
      const sdk = await audiusSdk()
      return await getWalletAccountQueryFn(wallet!, sdk)
    },
    ...options,
    enabled: options?.enabled !== false && !!wallet
  })
}
