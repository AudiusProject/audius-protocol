import { useCallback } from 'react'

import { useCurrentUserId } from '@audius/common/api'
import { ID, User, FollowSource } from '@audius/common/models'
import { profilePageActions, usersSocialActions } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { FollowButton } from '@audius/harmony'
import cn from 'classnames'
import { range } from 'lodash'
import InfiniteScroll from 'react-infinite-scroller'
import { useDispatch } from 'react-redux'

import ArtistChip from 'components/artist/ArtistChip'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { MountPlacement } from 'components/types'
import * as unfollowConfirmationActions from 'components/unfollow-confirmation-modal/store/actions'
import { useIsMobile } from 'hooks/useIsMobile'
import { push } from 'utils/navigation'

import styles from './UserListV2.module.css'

const { profilePage } = route
const { setNotificationSubscription } = profilePageActions

const SCROLL_THRESHOLD = 400

type SkeletonItem = {
  _loading: true
  user_id: string
}

const skeletonData: SkeletonItem[] = range(6).map((index) => ({
  _loading: true,
  user_id: `skeleton ${index}`
}))

type UserListV2Props = {
  /**
   * The list of users to display
   */
  data: User[]
  /**
   * Whether there are more users to load
   */
  hasMore: boolean
  /**
   * Whether we're loading more users
   */
  isLoadingMore: boolean
  /**
   * Whether we're loading the initial data
   */
  isLoading: boolean
  /**
   * Function to load more users
   */
  loadMore: () => void
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
  hasMore,
  isLoadingMore,
  isLoading,
  loadMore,
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

  const showSkeletons = hasMore || isLoading
  const displayData = [...data, ...(showSkeletons ? skeletonData : [])]

  return (
    <div className={styles.content}>
      <InfiniteScroll
        pageStart={0}
        loadMore={loadMore}
        hasMore={hasMore}
        useWindow={!getScrollParent}
        initialLoad={false}
        threshold={SCROLL_THRESHOLD}
        getScrollParent={getScrollParent}
      >
        {displayData.map((user, index) =>
          '_loading' in user ? (
            <div key={user.user_id} className={styles.userContainer}>
              <span>Loading...</span>
            </div>
          ) : (
            <div
              key={user.user_id}
              className={cn(styles.userContainer, {
                [styles.notLastUser]: index !== data.length - 1
              })}
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
            </div>
          )
        )}
        {!getScrollParent && isLoadingMore && <div className={styles.spacer} />}
        <div
          className={cn(styles.loadingAnimation, {
            [styles.show]: isLoadingMore
          })}
        >
          <LoadingSpinner className={styles.spinner} />
        </div>
      </InfiniteScroll>
    </div>
  )
}
