import React from 'react'

import {
  useCurrentAccountUser,
  selectIsAccountComplete,
  useHasAccount
} from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import { route } from '@audius/common/utils'
import { IconWallet } from '@audius/harmony'

import { LeftNavLink } from '../LeftNavLink'
import { RestrictedExpandableNavItem } from '../RestrictedExpandableNavItem'
import { WalletsNestedContent } from '../WalletsNestedContent'

const { WALLET_PAGE } = route

export const WalletNavItem = () => {
  const hasAccount = useHasAccount()
  const { data: isAccountComplete = false } = useCurrentAccountUser({
    select: selectIsAccountComplete
  })
  const { isEnabled: isWalletUIUpdateEnabled } = useFeatureFlag(
    FeatureFlags.WALLET_UI_UPDATE
  )

  if (isWalletUIUpdateEnabled) {
    return (
      <LeftNavLink
        leftIcon={IconWallet}
        to={WALLET_PAGE}
        disabled={!hasAccount}
        restriction='account'
      >
        Wallet
      </LeftNavLink>
    )
  }

  return (
    <RestrictedExpandableNavItem
      label='Wallets'
      leftIcon={IconWallet}
      restriction='account'
      nestedItems={<WalletsNestedContent />}
      canUnfurl={isAccountComplete}
      disabled={!hasAccount}
    />
  )
}
