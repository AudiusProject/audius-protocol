import { useMemo, type ReactNode } from 'react'

import {
  useAccountHasClaimableRewards,
  useChallengeCooldownSchedule,
  useFeatureFlag
} from '@audius/common/hooks'
import { Name } from '@audius/common/models'
import { StringKeys, FeatureFlags } from '@audius/common/services'
import { chatSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import type { IconComponent } from '@audius/harmony-native'
import {
  IconEmbed,
  IconMessages,
  IconSettings,
  IconCloudUpload,
  IconUser,
  IconGift,
  IconWallet,
  NotificationCount
} from '@audius/harmony-native'
import { useRemoteVar } from 'app/hooks/useRemoteConfig'
import type { AppTabScreenParamList } from 'app/screens/app-screen'
import { make } from 'app/services/analytics'
import { env } from 'app/services/env'

const { getHasUnreadMessages, getUnreadMessagesCount } = chatSelectors

const messages = {
  profile: 'My Profile',
  rewards: 'Rewards',
  upload: 'Upload',
  settings: 'Settings',
  featureFlags: 'Feature Flags',
  wallet: 'Wallet'
}

type NavItem = {
  icon: IconComponent
  label: string
  to: keyof AppTabScreenParamList
  params?: AppTabScreenParamList[keyof AppTabScreenParamList]
  onPress?: () => void
  showNotificationBubble?: boolean
  rightIcon?: ReactNode
}

export const useNavConfig = () => {
  const { isEnabled: isFeatureFlagAccessEnabled } = useFeatureFlag(
    FeatureFlags.FEATURE_FLAG_ACCESS
  )
  const challengeRewardIds = useRemoteVar(StringKeys.CHALLENGE_REWARD_IDS)
  const hasClaimableRewards = useAccountHasClaimableRewards(challengeRewardIds)
  const hasUnreadMessages = useSelector(getHasUnreadMessages)
  const unreadMessagesCount = useSelector(getUnreadMessagesCount)
  const { claimableAmount } = useChallengeCooldownSchedule({
    multiple: true
  })

  const navItems = useMemo(() => {
    const items: NavItem[] = [
      {
        icon: IconUser,
        label: messages.profile,
        to: 'Profile',
        params: { handle: 'accountUser' }
      },
      {
        icon: IconMessages,
        label: 'Messages',
        to: 'ChatList',
        showNotificationBubble: hasUnreadMessages,
        onPress: () => {
          make({ eventName: Name.CHAT_ENTRY_POINT, source: 'navmenu' })
        },
        rightIcon:
          unreadMessagesCount > 0 ? (
            <NotificationCount count={unreadMessagesCount} />
          ) : undefined
      },
      {
        icon: IconWallet,
        label: messages.wallet,
        to: 'wallet'
      },
      {
        icon: IconGift,
        label: messages.rewards,
        to: 'RewardsScreen',
        showNotificationBubble: hasClaimableRewards,
        rightIcon: hasClaimableRewards ? (
          <NotificationCount count={claimableAmount} />
        ) : undefined
      },
      {
        icon: IconCloudUpload,
        label: messages.upload,
        to: 'Upload'
      },
      {
        icon: IconSettings,
        label: messages.settings,
        to: 'SettingsScreen'
      }
    ]

    if (env.ENVIRONMENT === 'staging' || isFeatureFlagAccessEnabled) {
      items.push({
        icon: IconEmbed,
        label: messages.featureFlags,
        to: 'FeatureFlagOverride' as const
      })
    }

    return items
  }, [
    hasUnreadMessages,
    unreadMessagesCount,
    claimableAmount,
    hasClaimableRewards,
    isFeatureFlagAccessEnabled
  ])

  return {
    navItems
  }
}
