import { useCallback } from 'react'

import { useCurrentUserId, useGetCurrentWeb3User } from '~/api'
import { useAppContext } from '~/context'
import { Name } from '~/models/Analytics'
import { UserMetadata } from '~/models/User'

export const useAccountSwitcher = () => {
  const { localStorage } = useAppContext()
  const { data: currentWeb3User } = useGetCurrentWeb3User({})
  const {
    analytics: { make, track }
  } = useAppContext()

  const switchAccount = useCallback(
    async (user: UserMetadata) => {
      if (!user.wallet) {
        console.error('User has no wallet address')
        return
      }
      await track(
        make({
          eventName: Name.MANAGER_MODE_SWITCH_ACCOUNT,
          managedUserId: user.user_id
        })
      )

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
    [currentWeb3User, localStorage, make, track]
  )

  /** Convenience method to switch out of Manager Mode and back to the current web3 user */
  const switchToWeb3User = useCallback(async () => {
    if (!currentWeb3User) {
      console.error('No current web3 user')
      return
    }
    switchAccount(currentWeb3User)
  }, [switchAccount, currentWeb3User])

  return { switchAccount, switchToWeb3User }
}

/** Determines if we are in Manager Mode, i.e. the current user is not the logged-in user */
export const useIsManagedAccount = () => {
  const { data: currentWeb3User } = useGetCurrentWeb3User({})
  const { data: currentUserId } = useCurrentUserId()
  return (
    !!currentWeb3User &&
    !!currentUserId &&
    currentWeb3User.user_id !== currentUserId
  )
}
