import { useCallback, useMemo } from 'react'

import { useCurrentUserId } from '@audius/common/api'
import { ID, User, FollowSource } from '@audius/common/models'
import { profilePageActions, usersSocialActions } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { Flex, FollowButton, useScrollbarRef } from '@audius/harmony'
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
  isPending: boolean
  /**
   * Function to load more users
   */
  fetchNextPage?: () => void
  /**
   * Optional callback before clicking artist name
   */
  beforeClickArtistName?: () => void
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
  isPending,
  fetchNextPage,
  beforeClickArtistName,
  showSupportFor,
  showSupportFrom
}: UserListV2Props) => {
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const { data: currentUserId } = useCurrentUserId()
  const scrollRef = useScrollbarRef()

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage?.()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleFollow = useCallback(
    (userId: ID) => {
      dispatch(usersSocialActions.followUser(userId, FollowSource.USER_LIST))
    },
    [dispatch]
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
    },
    [dispatch, isMobile]
  )

  const handleClickArtistName = useCallback(
    (handle: string) => {
      beforeClickArtistName?.()
      dispatch(push(profilePage(handle)))
    },
    [dispatch, beforeClickArtistName]
  )

  const showSkeletons = isPending || isFetchingNextPage

  const skeletonData = useMemo(() => {
    // Determine the tag for skeleton items based on whether we're showing support info
    let skeletonTag: string | undefined
    if (showSupportFor) {
      skeletonTag = 'TOP SUPPORTERS'
    } else if (showSupportFrom) {
      skeletonTag = 'SUPPORTING'
    }

    return range(15).map((index) => ({
      _loading: true,
      user_id: `skeleton ${index}`,
      tag: skeletonTag
    }))
  }, [showSupportFor, showSupportFrom])

  // Create skeleton data with the appropriate tag
  const displayData = useMemo(() => {
    return [...(data ?? []), ...(showSkeletons ? skeletonData : [])]
  }, [data, showSkeletons, skeletonData])

  return (
    <Flex h='100%' column>
      <InfiniteScroll
        pageStart={0}
        loadMore={handleLoadMore}
        hasMore={hasNextPage}
        useWindow={false}
        initialLoad={false}
        threshold={SCROLL_THRESHOLD}
        getScrollParent={scrollRef ? () => scrollRef?.current : undefined}
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
