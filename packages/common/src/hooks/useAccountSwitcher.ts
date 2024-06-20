import { useCallback } from 'react'

import { useGetCurrentUserId, useGetCurrentWeb3User } from '~/api/account'
import { useAppContext } from '~/context'
import { UserMetadata } from '~/models/User'

export const useAccountSwitcher = () => {
  const { localStorage } = useAppContext()
  const { data: currentWeb3User } = useGetCurrentWeb3User({})

  const switchAccount = useCallback(
    async (user: UserMetadata) => {
      if (!user.wallet) {
        console.error('User has no wallet address')
        return
      }

      // Set an override if we aren't using the wallet of the "signed in" user
      if (currentWeb3User && currentWeb3User.wallet === user.wallet) {
        await localStorage.clearAudiusUserWalletOverride()
      } else {
        await localStorage.setAudiusUserWalletOverride(user.wallet)
      }

      await localStorage.clearAudiusAccount()
      await localStorage.clearAudiusAccountUser()

      window.location.reload()
    },
    [currentWeb3User, localStorage]
  )

  return { switchAccount }
}

/** Determines if we are in Manager Mode, i.e. the current user is not the logged-in user */
export const useIsManagedAccount = () => {
  const { data: currentWeb3User } = useGetCurrentWeb3User({})
  const { data: currentUserId } = useGetCurrentUserId({})
  return (
    !!currentWeb3User &&
    !!currentUserId &&
    currentWeb3User.user_id !== currentUserId
  )
}
