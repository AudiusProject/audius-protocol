import { useCallback } from 'react'

import { useCurrentUserId } from '@audius/common/api'
import { ID, User, FollowSource } from '@audius/common/models'
import { profilePageActions, usersSocialActions } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { Flex, FollowButton } from '@audius/harmony'
import { range } from 'lodash'
import InfiniteScroll from 'react-infinite-scroller'
import { useDispatch } from 'react-redux'

import ArtistChip from 'components/artist/ArtistChip'
import { MountPlacement } from 'components/types'
import * as unfollowConfirmationActions from 'components/unfollow-confirmation-modal/store/actions'
import { useIsMobile } from 'hooks/useIsMobile'
import { push } from 'utils/navigation'

import { UserListItemSkeleton } from './UserListItemSkeleton'

const { profilePage } = route
const { setNotificationSubscription } = profilePageActions

const SCROLL_THRESHOLD = 400

type SkeletonItem = {
  _loading: true
  user_id: string
  tag?: string
}

type UserListV2Props = {
  /**
   * The list of users to display
   */
  data: User[] | undefined
  /**
   * Whether there are more users to load
   */
  hasNextPage: boolean
  /**
   * Whether we're loading more users
   */
  isFetchingNextPage: boolean
  /**
   * Whether we're loading the initial data
   */
  isLoading: boolean
  /**
   * Function to load more users
   */
  fetchNextPage: () => void
  /**
   * Callback when a user navigates away
   */
  onNavigateAway?: () => void
  /**
   * Callback after following a user
   */
  afterFollow?: () => void
  /**
   * Callback after unfollowing a user
   */
  afterUnfollow?: () => void
  /**
   * Optional callback before clicking artist name
   */
  beforeClickArtistName?: () => void
  /**
   * Optional function to get scroll parent element
   */
  getScrollParent?: () => HTMLElement | null
  /**
   * Optional user ID to show support for (used in top supporters list)
   */
  showSupportFor?: ID
  /**
   * Optional user ID to show support from (used in supporting list)
   */
  showSupportFrom?: ID
}

export const UserListV2 = ({
  data,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  fetchNextPage,
  onNavigateAway,
  afterFollow,
  afterUnfollow,
  beforeClickArtistName,
  getScrollParent,
  showSupportFor,
  showSupportFrom
}: UserListV2Props) => {
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const { data: currentUserId } = useCurrentUserId()

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleFollow = useCallback(
    (userId: ID) => {
      dispatch(usersSocialActions.followUser(userId, FollowSource.USER_LIST))
      afterFollow?.()
    },
    [dispatch, afterFollow]
  )

  const handleUnfollow = useCallback(
    (userId: ID) => {
      if (isMobile) {
        dispatch(unfollowConfirmationActions.setOpen(userId))
      } else {
        dispatch(
          usersSocialActions.unfollowUser(userId, FollowSource.USER_LIST)
        )
        dispatch(setNotificationSubscription(userId, false, false))
      }
      afterUnfollow?.()
    },
    [dispatch, isMobile, afterUnfollow]
  )

  const handleClickArtistName = useCallback(
    (handle: string) => {
      beforeClickArtistName?.()
      dispatch(push(profilePage(handle)))
    },
    [dispatch, beforeClickArtistName]
  )

  const showSkeletons = isLoading || isFetchingNextPage

  // Determine the tag for skeleton items based on whether we're showing support info
  let skeletonTag: string | undefined
  if (showSupportFor) {
    skeletonTag = 'TOP SUPPORTERS'
  } else if (showSupportFrom) {
    skeletonTag = 'SUPPORTING'
  }

  // Create skeleton data with the appropriate tag
  const currentSkeletonData: SkeletonItem[] = range(6).map((index) => ({
    _loading: true,
    user_id: `skeleton ${index}`,
    tag: skeletonTag
  }))

  const displayData = [
    ...(data ?? []),
    ...(showSkeletons ? currentSkeletonData : [])
  ]

  console.log('display length', displayData.length)

  return (
    <Flex h='100%' column>
      <InfiniteScroll
        pageStart={0}
        loadMore={handleLoadMore}
        hasMore={hasNextPage}
        useWindow={false}
        initialLoad={false}
        threshold={SCROLL_THRESHOLD}
        getScrollParent={getScrollParent}
        css={(theme) => ({
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.s,
          padding: theme.spacing.s
        })}
      >
        {displayData.map((user) =>
          '_loading' in user ? (
            <UserListItemSkeleton key={user.user_id} tag={user.tag} />
          ) : (
            <Flex
              alignItems='center'
              justifyContent='space-between'
              borderBottom='strong'
              p='m'
              key={user.user_id}
            >
              <ArtistChip
                user={user}
                onClickArtistName={() => handleClickArtistName(user.handle)}
                onNavigateAway={onNavigateAway}
                showPopover={!isMobile}
                popoverMount={MountPlacement.BODY}
                showSupportFor={showSupportFor}
                showSupportFrom={showSupportFrom}
              />
              {user.user_id !== currentUserId && (
                <FollowButton
                  size='small'
                  isFollowing={user.does_current_user_follow}
                  onFollow={() => handleFollow(user.user_id)}
                  onUnfollow={() => handleUnfollow(user.user_id)}
                  fullWidth={false}
                />
              )}
            </Flex>
          )
        )}
      </InfiniteScroll>
    </Flex>
  )
}
