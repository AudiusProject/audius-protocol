import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

import { accountFromSDK } from '~/adapters/user'
import { useAudiusQueryContext } from '~/audius-query'
import { SolanaWalletAddress } from '~/models/Wallet'
import { getWalletAddresses } from '~/store/account/selectors'

import { QUERY_KEYS } from './queryKeys'
import type { Config } from './useUser'

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
      // If we got a valid account, populate user bank since that's
      // expected to exist on "account" users
      if (account) {
        const userBank =
          await sdk.services.claimableTokensClient.deriveUserBank({
            ethWallet: currentUser!,
            mint: 'wAUDIO'
          })
        account.user.userBank = userBank.toString() as SolanaWalletAddress
      }
      return account?.user
    },
    staleTime: config?.staleTime,
    enabled: config?.enabled !== false && !!currentUser
  })
}
