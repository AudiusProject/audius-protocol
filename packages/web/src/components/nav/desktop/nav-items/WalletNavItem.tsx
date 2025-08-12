import { useHasAccount } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import { route } from '@audius/common/utils'
import { IconWallet } from '@audius/harmony'

import { LeftNavLink } from '../LeftNavLink'

const { WALLET_PAGE } = route

const messages = {
  wallet: 'Wallet'
}

export const WalletNavItem = () => {
  const hasAccount = useHasAccount()
  const { isEnabled: isArtistCoinsEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )

  return (
    <LeftNavLink
      leftIcon={IconWallet}
      to={WALLET_PAGE}
      disabled={!hasAccount && !isArtistCoinsEnabled}
      restriction={!hasAccount && !isArtistCoinsEnabled ? 'account' : 'none'}
    >
      {messages.wallet}
    </LeftNavLink>
  )
}
