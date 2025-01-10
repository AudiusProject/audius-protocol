import { useCallback, useRef } from 'react'

import { useCurrentUserId } from '@audius/common/api'
import { ID, User, FollowSource } from '@audius/common/models'
import { profilePageActions, usersSocialActions } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { FollowButton, Scrollbar } from '@audius/harmony'
import { css } from '@emotion/react'
import cn from 'classnames'
import { range } from 'lodash'
import InfiniteScroll from 'react-infinite-scroller'
import { useDispatch } from 'react-redux'

import ArtistChip from 'components/artist/ArtistChip'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { MountPlacement } from 'components/types'
import * as unfollowConfirmationActions from 'components/unfollow-confirmation-modal/store/actions'
import { useIsMobile } from 'hooks/useIsMobile'
import { setVisibility } from 'store/application/ui/userListModal/slice'
import { push } from 'utils/navigation'

import styles from './UserListV2.module.css'

const { profilePage } = route
const { setNotificationSubscription } = profilePageActions

const SCROLL_THRESHOLD = 100

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
  getScrollParent,
  showSupportFor,
  showSupportFrom
}: UserListV2Props) => {
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const { data: currentUserId } = useCurrentUserId()

  const handleClose = useCallback(() => dispatch(setVisibility(false)), [])

  const handleFollow = useCallback(
    (userId: ID) => {
      if (!currentUserId) {
        handleClose()
      } else {
        dispatch(usersSocialActions.followUser(userId, FollowSource.USER_LIST))
      }
    },
    [currentUserId, dispatch, handleClose]
  )

  const handleUnfollow = useCallback(
    (userId: ID) => {
      if (!currentUserId) {
        handleClose()
      } else if (isMobile) {
        dispatch(unfollowConfirmationActions.setOpen(userId))
      } else {
        dispatch(
          usersSocialActions.unfollowUser(userId, FollowSource.USER_LIST)
        )
        dispatch(setNotificationSubscription(userId, false, false))
      }
    },
    [currentUserId, isMobile, handleClose, dispatch]
  )

  const handleClickArtistName = useCallback(
    (handle: string) => {
      dispatch(push(profilePage(handle)))
      handleClose()
    },
    [dispatch, handleClose]
  )

  const displayData = [...data, ...(isLoading ? skeletonData : [])]

  const scrollParentRef = useRef<HTMLElement | null>(null)

  return (
    <Scrollbar
      css={css`
        min-height: 0;
        max-height: 690px;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
      `}
      containerRef={(containerRef) => {
        scrollParentRef.current = containerRef
      }}
    >
      <div className={styles.content}>
        <InfiniteScroll
          pageStart={0}
          loadMore={loadMore}
          hasMore={hasMore}
          useWindow={false}
          initialLoad={false}
          threshold={SCROLL_THRESHOLD}
          getScrollParent={() => scrollParentRef.current}
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
                  onNavigateAway={handleClose}
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
          {isLoadingMore && <div className={styles.spacer} />}
          <div
            className={cn(styles.loadingAnimation, {
              [styles.show]: isLoadingMore
            })}
          >
            <LoadingSpinner className={styles.spinner} />
          </div>
        </InfiniteScroll>
      </div>
    </Scrollbar>
  )
}
