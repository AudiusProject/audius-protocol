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
  IconTrending,
  IconWallet,
  LoadingSpinner,
  NotificationCount,
  useTheme
} from '@audius/harmony'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { useAccountTransition } from 'hooks/useAccountTransition'
import { RestrictionType } from 'hooks/useRequiresAccount'
import { matchesRoute } from 'utils/route'

import { NavSpeakerIcon } from './NavSpeakerIcon'
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
const { getHasAccount } = accountSelectors
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
  const { displayIsComplete: isAccountComplete, isTransitioning } =
    useAccountTransition()
  const hasAccount = useSelector(getHasAccount)
  const unreadMessagesCount = useSelector(getUnreadMessagesCount)
  const isUploading = useSelector(getIsUploading)
  const { color, spacing } = useTheme()
  const { claimableAmount } = useChallengeCooldownSchedule({
    multiple: true
  })
  const playingFromRoute = useNavSourcePlayingStatus()
  const location = useLocation()

  const navItems = useMemo((): NavItemConfig[] => {
    // During transition, don't show any nav items
    if (isTransitioning) {
      return []
    }

    return [
      createNavItemWithSpeaker({
        label: 'Feed',
        leftIcon: IconFeed,
        targetRoute: FEED_PAGE,
        restriction: 'account',
        disabled: !hasAccount,
        playingFromRoute
      }),
      createNavItemWithSpeaker({
        label: 'Trending',
        leftIcon: IconTrending,
        targetRoute: TRENDING_PAGE,
        playingFromRoute,
        restriction: 'none'
      }),
      createNavItemWithSpeaker({
        label: 'Explore',
        leftIcon: IconExplore,
        targetRoute: EXPLORE_PAGE,
        playingFromRoute,
        restriction: 'none'
      }),
      createNavItemWithSpeaker({
        label: 'Library',
        leftIcon: IconLibrary,
        targetRoute: LIBRARY_PAGE,
        restriction: 'guest',
        disabled: !hasAccount,
        playingFromRoute
      }),
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
    ]
  }, [
    hasAccount,
    unreadMessagesCount,
    location.pathname,
    isAccountComplete,
    claimableAmount,
    isUploading,
    playingFromRoute,
    color,
    spacing,
    isTransitioning
  ])

  return navItems
}
