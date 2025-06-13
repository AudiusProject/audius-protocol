import React from 'react'

import {
  useAccountHasClaimableRewards,
  useChallengeCooldownSchedule,
  useRemoteVar
} from '@audius/common/hooks'
import { StringKeys } from '@audius/common/services'

import { IconGift, NotificationCount } from '@audius/harmony-native'

import { LeftNavLink } from './LeftNavLink'

export const RewardsNavItem = () => {
  const challengeRewardIds = useRemoteVar(StringKeys.CHALLENGE_REWARD_IDS)
  const hasClaimableRewards = useAccountHasClaimableRewards(challengeRewardIds)
  const { claimableAmount } = useChallengeCooldownSchedule({
    multiple: true
  })

  return (
    <LeftNavLink
      icon={IconGift}
      label='Rewards'
      to='RewardsScreen'
      showNotificationBubble={hasClaimableRewards}
    >
      {hasClaimableRewards ? (
        <NotificationCount count={claimableAmount} />
      ) : undefined}
    </LeftNavLink>
  )
}
