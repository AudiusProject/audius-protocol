import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { accountFromSDK } from '~/adapters/user'
import { useAppContext } from '~/context/appContext'
import { SolanaWalletAddress } from '~/models/Wallet'
import { getWalletAddresses } from '~/store/account/selectors'

import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'

/**
 * Hook to get the currently logged in user's data
 */
export const useCurrentUser = (options?: QueryOptions) => {
  const { audiusSdk } = useAppContext()
  const { currentUser } = useSelector(getWalletAddresses)

  return useQuery({
    queryKey: [QUERY_KEYS.accountUser, currentUser],
    queryFn: async () => {
      const { data } = await audiusSdk!.full.users.getUserAccount({
        wallet: currentUser!
      })

      if (!data) {
        console.warn('Missing user from account response')
        return null
      }

      const account = accountFromSDK(data)
      // If we got a valid account, populate user bank since that's
      // expected to exist on "account" users
      if (account) {
        const userBank =
          await audiusSdk!.services.claimableTokensClient.deriveUserBank({
            ethWallet: currentUser!,
            mint: 'wAUDIO'
          })
        account.user.userBank = userBank.toString() as SolanaWalletAddress
      }
      return account?.user
    },
    staleTime: options?.staleTime,
    enabled: options?.enabled !== false && !!audiusSdk && !!currentUser
  })
}
