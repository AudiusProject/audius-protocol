import { useCallback } from 'react'
import { useGetCurrentUserId, useGetCurrentWeb3User } from '~/api/account'

import { useAppContext } from '~/context'
import { UserMetadata } from '~/models/User'

// Matches corresponding key in libs (DISCOVERY_PROVIDER_USER_WALLET_OVERRIDE)
const USER_WALLET_OVERRIDE_KEY = '@audius/user-wallet-override'

export const useAccountSwitcher = () => {
  const { localStorage } = useAppContext()
  const switchAccount = useCallback(
    async (user: UserMetadata) => {
      if (!user.wallet) {
        console.error('User has no wallet address')
        return
      }

      await localStorage.setItem(USER_WALLET_OVERRIDE_KEY, user.wallet)
      await localStorage.clearAudiusAccount()
      await localStorage.clearAudiusAccountUser()

      window.location.reload()
    },
    [localStorage]
  )

  return { switchAccount }
}

export const useIsManagedAccount = () => {
  const { data: currentWeb3User } = useGetCurrentWeb3User({})
  const { data: currentUserId } = useGetCurrentUserId({})
  return (
    !!currentWeb3User &&
    !!currentUserId &&
    currentWeb3User.user_id !== currentUserId
  )
}
