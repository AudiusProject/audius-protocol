import { ReactNode, useMemo } from 'react'

import { useChallengeCooldownSchedule } from '@audius/common/hooks'
import {
  accountSelectors,
  chatSelectors,
  uploadSelectors
} from '@audius/common/store'
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
  IconSpeaker,
  IconTrending,
  IconWallet,
  LoadingSpinner,
  NotificationCount,
  useTheme
} from '@audius/harmony'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { RestrictionType } from 'hooks/useRequiresAccount'

import { PlaylistLibrary } from './PlaylistLibrary'
import { CreatePlaylistLibraryItemButton } from './PlaylistLibrary/CreatePlaylistLibraryItemButton'
import { WalletsNestedContent } from './WalletsNestedContent'
import { useNavSourcePlayingStatus } from './useNavSourcePlayingStatus'

const {
  EXPLORE_PAGE,
  FEED_PAGE,
  LIBRARY_PAGE,
  TRENDING_PAGE,
  CHATS_PAGE,
  UPLOAD_PAGE,
  REWARDS_PAGE
} = route

const { getUnreadMessagesCount } = chatSelectors
const { getIsAccountComplete, getHasAccount } = accountSelectors
const { getIsUploading } = uploadSelectors

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

const matchesRoute = ({
  current,
  target
}: {
  current: string | null
  target: string
}) => {
  return current?.startsWith(target) ?? false
}

export const useNavConfig = () => {
  const hasAccount = useSelector(getHasAccount)
  const isAccountComplete = useSelector(getIsAccountComplete)
  const unreadMessagesCount = useSelector(getUnreadMessagesCount)
  const isUploading = useSelector(getIsUploading)
  const { color, spacing } = useTheme()
  const { claimableAmount } = useChallengeCooldownSchedule({
    multiple: true
  })
  const playingFromRoute = useNavSourcePlayingStatus()
  const location = useLocation()

  const navItems = useMemo(
    (): NavItemConfig[] => [
      {
        label: 'Feed',
        leftIcon: IconFeed,
        to: FEED_PAGE,
        restriction: 'account',
        disabled: !hasAccount,
        rightIcon: matchesRoute({
          current: playingFromRoute,
          target: FEED_PAGE
        }) ? (
          <IconSpeaker
            size='s'
            color={
              matchesRoute({
                current: location.pathname,
                target: FEED_PAGE
              })
                ? 'staticWhite'
                : 'accent'
            }
          />
        ) : undefined
      },
      {
        label: 'Trending',
        leftIcon: IconTrending,
        to: TRENDING_PAGE,
        restriction: 'none',
        rightIcon: matchesRoute({
          current: playingFromRoute,
          target: TRENDING_PAGE
        }) ? (
          <IconSpeaker
            size='s'
            color={
              matchesRoute({
                current: location.pathname,
                target: TRENDING_PAGE
              })
                ? 'staticWhite'
                : 'accent'
            }
          />
        ) : undefined
      },
      {
        label: 'Explore',
        leftIcon: IconExplore,
        to: EXPLORE_PAGE,
        restriction: 'none',
        rightIcon: matchesRoute({
          current: playingFromRoute,
          target: EXPLORE_PAGE
        }) ? (
          <IconSpeaker
            size='s'
            color={
              matchesRoute({
                current: location.pathname,
                target: EXPLORE_PAGE
              })
                ? 'staticWhite'
                : 'accent'
            }
          />
        ) : undefined
      },
      {
        label: 'Library',
        leftIcon: IconLibrary,
        to: LIBRARY_PAGE,
        restriction: 'guest',
        disabled: !hasAccount,
        rightIcon: matchesRoute({
          current: playingFromRoute,
          target: LIBRARY_PAGE
        }) ? (
          <IconSpeaker
            size='s'
            color={
              matchesRoute({
                current: location.pathname,
                target: LIBRARY_PAGE
              })
                ? 'staticWhite'
                : 'accent'
            }
          />
        ) : undefined
      },
      {
        label: 'Messages',
        leftIcon: IconMessages,
        to: CHATS_PAGE,
        restriction: 'account',
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
      {
        label: 'Wallets',
        leftIcon: IconWallet,
        isExpandable: true,
        restriction: 'account',
        nestedComponent: WalletsNestedContent,
        canUnfurl: isAccountComplete,
        disabled: !hasAccount
      },
      {
        label: 'Rewards',
        leftIcon: IconGift,
        to: REWARDS_PAGE,
        restriction: 'account',
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
              color: matchesRoute({
                current: location.pathname,
                target: UPLOAD_PAGE
              })
                ? color.static.white
                : color.neutral.n800
            }}
          />
        ) : undefined,
        shouldPersistRightIcon: true,
        restriction: 'account',
        disabled: !hasAccount
      },
      {
        label: 'Playlists',
        leftIcon: IconPlaylists,
        isExpandable: true,
        rightIcon: <CreatePlaylistLibraryItemButton />,
        shouldPersistRightIcon: true,
        nestedComponent: PlaylistLibrary,
        restriction: 'account',
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
      playingFromRoute,
      color,
      spacing
    ]
  )

  return navItems
}
