import { ReactNode, useMemo } from 'react'

import {
  useChallengeCooldownSchedule,
  useFeatureFlag
} from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import { accountSelectors, chatSelectors } from '@audius/common/store'
import { route } from '@audius/common/utils'
import type { IconComponent } from '@audius/harmony'
import {
  IconCloudUpload,
  IconExplore,
  IconFeed,
  IconGift,
  IconLibrary,
  IconMessages,
  IconPlaylists,
  IconTrending,
  IconWallet,
  LoadingSpinner,
  NotificationCount,
  useTheme
} from '@audius/harmony'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { RestrictionType } from 'hooks/useRequiresAccount'
import { matchesRoute } from 'utils/route'

import { NavSpeakerIcon } from './NavSpeakerIcon'
import { PlaylistLibrary } from './PlaylistLibrary'
import { CreatePlaylistLibraryItemButton } from './PlaylistLibrary/CreatePlaylistLibraryItemButton'
import { WalletsNestedContent } from './WalletsNestedContent'
import { useNavSourcePlayingStatus } from './useNavSourcePlayingStatus'
import { useNavUploadStatus } from './useNavUploadStatus'

const {
  EXPLORE_PAGE,
  FEED_PAGE,
  LIBRARY_PAGE,
  TRENDING_PAGE,
  CHATS_PAGE,
  UPLOAD_PAGE,
  REWARDS_PAGE,
  WALLET_PAGE
} = route

const { getUnreadMessagesCount } = chatSelectors
const { getIsAccountComplete, getHasAccount } = accountSelectors

export type NavItemConfig = {
  label: string
  leftIcon: IconComponent
  to?: string
  isExpandable?: boolean
  rightIcon?: ReactNode
  shouldPersistRightIcon?: boolean
  nestedComponent?: React.ComponentType<any>
  disabled?: boolean
  restriction?: RestrictionType
  hasNotification?: boolean
  canUnfurl?: boolean
}

const createNavItemWithSpeaker = ({
  targetRoute,
  playingFromRoute,
  ...props
}: {
  targetRoute: string
  playingFromRoute: string | null
} & Omit<NavItemConfig, 'rightIcon' | 'to'>): NavItemConfig => ({
  ...props,
  to: targetRoute,
  rightIcon: (
    <NavSpeakerIcon
      playingFromRoute={playingFromRoute}
      targetRoute={targetRoute}
    />
  )
})

export const useNavConfig = () => {
  const hasAccount = useSelector(getHasAccount)
  const isAccountComplete = useSelector(getIsAccountComplete)
  const unreadMessagesCount = useSelector(getUnreadMessagesCount)
  const { isUploading, isOnUploadPage } = useNavUploadStatus()
  const { color, spacing } = useTheme()
  const { claimableAmount } = useChallengeCooldownSchedule({
    multiple: true
  })
  const playingFromRoute = useNavSourcePlayingStatus()
  const location = useLocation()
  const { isEnabled: isWalletUIUpdateEnabled } = useFeatureFlag(
    FeatureFlags.WALLET_UI_UPDATE
  )

  const navItems = useMemo(
    (): NavItemConfig[] => [
      createNavItemWithSpeaker({
        label: 'Feed',
        leftIcon: IconFeed,
        targetRoute: FEED_PAGE,
        restriction: 'account' as RestrictionType,
        disabled: !hasAccount,
        playingFromRoute
      }),
      createNavItemWithSpeaker({
        label: 'Trending',
        leftIcon: IconTrending,
        targetRoute: TRENDING_PAGE,
        playingFromRoute,
        restriction: 'none' as RestrictionType
      }),
      createNavItemWithSpeaker({
        label: 'Explore',
        leftIcon: IconExplore,
        targetRoute: EXPLORE_PAGE,
        playingFromRoute,
        restriction: 'none' as RestrictionType
      }),
      createNavItemWithSpeaker({
        label: 'Library',
        leftIcon: IconLibrary,
        targetRoute: LIBRARY_PAGE,
        restriction: 'guest' as RestrictionType,
        disabled: !hasAccount,
        playingFromRoute
      }),
      {
        label: 'Messages',
        leftIcon: IconMessages,
        to: CHATS_PAGE,
        restriction: 'account' as RestrictionType,
        rightIcon:
          unreadMessagesCount > 0 ? (
            <NotificationCount
              count={unreadMessagesCount}
              isSelected={matchesRoute({
                current: location.pathname,
                target: CHATS_PAGE
              })}
            />
          ) : undefined,
        hasNotification: unreadMessagesCount > 0,
        disabled: !hasAccount
      },
      ...(isWalletUIUpdateEnabled
        ? [
            {
              label: 'Wallet',
              leftIcon: IconWallet,
              to: WALLET_PAGE,
              restriction: 'account' as RestrictionType,
              disabled: !hasAccount
            }
          ]
        : [
            {
              label: 'Wallets',
              leftIcon: IconWallet,
              isExpandable: true,
              restriction: 'account' as RestrictionType,
              nestedComponent: WalletsNestedContent,
              canUnfurl: isAccountComplete,
              disabled: !hasAccount
            }
          ]),
      {
        label: 'Rewards',
        leftIcon: IconGift,
        to: REWARDS_PAGE,
        restriction: 'account' as RestrictionType,
        rightIcon:
          claimableAmount > 0 ? (
            <NotificationCount
              count={claimableAmount}
              isSelected={matchesRoute({
                current: location.pathname,
                target: REWARDS_PAGE
              })}
            />
          ) : undefined,
        hasNotification: claimableAmount > 0,
        disabled: !hasAccount
      },
      {
        label: 'Upload',
        leftIcon: IconCloudUpload,
        to: UPLOAD_PAGE,
        rightIcon: isUploading ? (
          <LoadingSpinner
            css={{
              width: spacing.unit6,
              height: spacing.unit6,
              color: isOnUploadPage ? color.static.white : color.neutral.n800
            }}
          />
        ) : undefined,
        shouldPersistRightIcon: true,
        restriction: 'account' as RestrictionType,
        disabled: !hasAccount
      },
      {
        label: 'Playlists',
        leftIcon: IconPlaylists,
        isExpandable: true,
        rightIcon: <CreatePlaylistLibraryItemButton />,
        shouldPersistRightIcon: true,
        nestedComponent: PlaylistLibrary,
        restriction: 'account' as RestrictionType,
        canUnfurl: isAccountComplete,
        disabled: !hasAccount
      }
    ],
    [
      hasAccount,
      unreadMessagesCount,
      location.pathname,
      isAccountComplete,
      claimableAmount,
      isUploading,
      isOnUploadPage,
      playingFromRoute,
      color,
      spacing,
      isWalletUIUpdateEnabled
    ]
  )

  return navItems
}
