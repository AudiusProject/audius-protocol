import { AudiusSdk } from '@audius/sdk'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { accountFromSDK } from '~/adapters/user'
import { useQueryContext } from '~/api/tan-query/utils'
import { AccountUserMetadata, UserMetadata } from '~/models'
import { getWalletAddresses } from '~/store/account/selectors'

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
  const { audiusSdk } = useQueryContext()

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

// Some helper selectors - these pull the current wallet addresses out of redux for you
// NOTE: currentUser means the user that we are currently auth-ed into - i.e. the managed user
export const useGetCurrentUser = <TResult = UserMetadata | undefined>(
  options?: SelectableQueryOptions<
    AccountUserMetadata | null | undefined,
    TResult
  >
) => {
  const { currentUser } = useSelector(getWalletAddresses)

  return useWalletAccount<TResult>(currentUser, {
    select: (data: AccountUserMetadata | null | undefined): TResult =>
      data?.user as TResult,
    ...options
  })
}

// Some helper selectors - these pull the current wallet addresses out of redux for you
// NOTE: web3User means the user that signed in originally (i.e. could be a manager)
export const useGetCurrentWeb3User = <TResult = UserMetadata | undefined>(
  options?: SelectableQueryOptions<
    AccountUserMetadata | null | undefined,
    TResult
  >
) => {
  const { web3User } = useSelector(getWalletAddresses)

  return useWalletAccount<TResult>(web3User, {
    select: (data: AccountUserMetadata | null | undefined): TResult =>
      data?.user as TResult,
    ...options
  })
}

// NOTE: currentUser means the user that we are currently auth-ed into - i.e. the managed user
export const useGetCurrentUserId = <TResult = number | undefined>(
  options?: SelectableQueryOptions<
    AccountUserMetadata | null | undefined,
    TResult
  >
) => {
  return useGetCurrentUser<TResult>({
    select: (accountData: AccountUserMetadata | null | undefined): TResult =>
      accountData?.user.user_id as TResult,
    ...options
  })
}
