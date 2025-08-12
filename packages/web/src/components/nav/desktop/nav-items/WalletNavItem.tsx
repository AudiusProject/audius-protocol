import { route } from '@audius/common/utils'
import { IconWallet } from '@audius/harmony'

import { LeftNavLink } from '../LeftNavLink'

const { WALLET_PAGE } = route

const messages = {
  wallet: 'Wallet'
}

export const WalletNavItem = () => {
  return (
    <LeftNavLink leftIcon={IconWallet} to={WALLET_PAGE} restriction='none'>
      {messages.wallet}
    </LeftNavLink>
  )
}
