import { ReactNode, useMemo } from 'react'

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
  NotificationCount
} from '@audius/harmony'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'

import { RestrictionType } from 'hooks/useRequiresAccount'

import { PlaylistLibrary } from './PlaylistLibrary'
import { CreatePlaylistLibraryItemButton } from './PlaylistLibrary/CreatePlaylistLibraryItemButton'
import { WalletsNestedContent } from './WalletsNestedContent'

const {
  EXPLORE_PAGE,
  FEED_PAGE,
  LIBRARY_PAGE,
  TRENDING_PAGE,
  CHATS_PAGE,
  UPLOAD_PAGE,
  REWARDS_PAGE
} = route

const { getIsAccountComplete, getHasAccount } = accountSelectors
const { getUnreadMessagesCount } = chatSelectors

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
}

export const useNavConfig = () => {
  const isAccountComplete = useSelector(getIsAccountComplete)
  const hasAccount = useSelector(getHasAccount)
  const unreadMessagesCount = useSelector(getUnreadMessagesCount)
  const location = useLocation()

  const navItems = useMemo(
    (): NavItemConfig[] => [
      {
        label: 'Feed',
        leftIcon: IconFeed,
        to: FEED_PAGE,
        restriction: 'account',
        disabled: !isAccountComplete
      },
      {
        label: 'Trending',
        leftIcon: IconTrending,
        to: TRENDING_PAGE,
        restriction: 'none'
      },
      {
        label: 'Explore',
        leftIcon: IconExplore,
        to: EXPLORE_PAGE,
        restriction: 'none'
      },
      {
        label: 'Library',
        leftIcon: IconLibrary,
        to: LIBRARY_PAGE,
        restriction: 'guest',
        disabled: !hasAccount
      },
      {
        label: 'Messages',
        leftIcon: IconMessages,
        to: CHATS_PAGE,
        restriction: 'account',
        disabled: !isAccountComplete,
        rightIcon:
          unreadMessagesCount > 0 ? (
            <NotificationCount
              count={unreadMessagesCount}
              isSelected={location.pathname === CHATS_PAGE}
            />
          ) : undefined,
        hasNotification: unreadMessagesCount > 0
      },
      {
        label: 'Wallets',
        leftIcon: IconWallet,
        isExpandable: true,
        restriction: 'account',
        disabled: !isAccountComplete,
        nestedComponent: WalletsNestedContent
      },
      {
        label: 'Rewards',
        leftIcon: IconGift,
        to: REWARDS_PAGE,
        restriction: 'account',
        disabled: !isAccountComplete
      },
      {
        label: 'Upload',
        leftIcon: IconCloudUpload,
        to: UPLOAD_PAGE,
        restriction: 'account',
        disabled: !isAccountComplete
      },
      {
        label: 'Playlists',
        leftIcon: IconPlaylists,
        isExpandable: true,
        rightIcon: <CreatePlaylistLibraryItemButton />,
        shouldPersistRightIcon: true,
        nestedComponent: PlaylistLibrary,
        restriction: 'account',
        disabled: !isAccountComplete
      }
    ],
    [isAccountComplete, hasAccount, unreadMessagesCount, location.pathname]
  )

  return navItems
}
