import React from 'react'

import { IconWallet } from '@audius/harmony-native'

import { LeftNavLink } from './LeftNavLink'

const messages = {
  wallet: 'Wallet'
}

export const WalletNavItem = () => {
  return <LeftNavLink icon={IconWallet} label={messages.wallet} to='wallet' />
}
