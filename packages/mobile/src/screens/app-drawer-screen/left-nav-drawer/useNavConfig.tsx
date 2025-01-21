import { useMemo, type ReactNode } from 'react'

import {
  useAccountHasClaimableRewards,
  useChallengeCooldownSchedule,
  useSelectTierInfo,
  useTotalBalanceWithFallback,
  useUSDCBalance
} from '@audius/common/hooks'
import { Name, Status } from '@audius/common/models'
import type { BNUSDC, User } from '@audius/common/models'
import { StringKeys, FeatureFlags } from '@audius/common/services'
import { accountSelectors, chatSelectors } from '@audius/common/store'
import {
  formatCurrencyBalance,
  formatUSDCWeiToFloorCentsNumber,
  formatWei,
  isNullOrUndefined
} from '@audius/common/utils'
import BN from 'bn.js'
import { useSelector } from 'react-redux'

import type { IconComponent } from '@audius/harmony-native'
import {
  BalancePill,
  IconCrown,
  IconDonate,
  IconEmbed,
  IconMessages,
  IconSettings,
  IconCloudUpload,
  IconUser,
  IconGift,
  useTheme,
  NotificationCount
} from '@audius/harmony-native'
import LogoUSDC from 'app/assets/images/logoUSDC.svg'
import { IconAudioBadge } from 'app/components/audio-rewards'
import { env } from 'app/env'
import { useFeatureFlag, useRemoteVar } from 'app/hooks/useRemoteConfig'
import type { AppTabScreenParamList } from 'app/screens/app-screen'
import { make } from 'app/services/analytics'

const { getAccountUser } = accountSelectors
const { getHasUnreadMessages, getUnreadMessagesCount } = chatSelectors

const messages = {
  profile: 'My Profile',
  usdc: 'USDC',
  audio: '$AUDIO',
  rewards: 'Rewards',
  upload: 'Upload',
  settings: 'Settings',
  featureFlags: 'Feature Flags',
  usdcDollarSign: (balance: string) => `$${balance}`
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
  const { spacing } = useTheme()
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
  const accountUser = useSelector(getAccountUser)
  const { user_id } = accountUser ?? ({} as User)
  const { tier } = useSelectTierInfo(user_id)
  const audioBalance = useTotalBalanceWithFallback()
  const audioBalanceFormatted = formatWei(audioBalance, true, 0)
  const isAudioBalanceLoading = isNullOrUndefined(audioBalance)

  const { data: usdcBalance, status: usdcBalanceStatus } = useUSDCBalance()
  const balanceCents = formatUSDCWeiToFloorCentsNumber(
    (usdcBalance ?? new BN(0)) as BNUSDC
  )
  const usdcBalanceFormatted = formatCurrencyBalance(balanceCents / 100)
  const isUSDCBalanceLoading = usdcBalanceStatus === Status.LOADING

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
        icon: IconCrown,
        label: messages.audio,
        to: 'AudioScreen',
        rightIcon: (
          <BalancePill
            balance={audioBalanceFormatted}
            icon={<IconAudioBadge tier={tier} showNoTier size='m' />}
            isLoading={isAudioBalanceLoading}
          />
        )
      },
      {
        icon: IconDonate,
        label: messages.usdc,
        to: 'PayAndEarnScreen',
        rightIcon: (
          <BalancePill
            balance={messages.usdcDollarSign(usdcBalanceFormatted)}
            icon={<LogoUSDC height={spacing.unit5} width={spacing.unit5} />}
            isLoading={isUSDCBalanceLoading}
          />
        )
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
    audioBalanceFormatted,
    tier,
    spacing.unit5,
    isAudioBalanceLoading,
    usdcBalanceFormatted,
    isUSDCBalanceLoading,
    hasClaimableRewards,
    isFeatureFlagAccessEnabled
  ])

  return {
    navItems
  }
}
