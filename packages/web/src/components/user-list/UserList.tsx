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

import styles from './UserList.module.css'

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

type UserListProps = {
  data: User[] | undefined
  hasNextPage: boolean
  isLoading: boolean
  fetchNextPage: () => void
  showSupportFor?: ID
  showSupportFrom?: ID
}

export const UserList = ({
  data,
  hasNextPage,
  isLoading,
  fetchNextPage,
  showSupportFor,
  showSupportFrom
}: UserListProps) => {
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const { data: currentUserId } = useCurrentUserId()

  const handleClose = useCallback(
    () => dispatch(setVisibility(false)),
    [dispatch]
  )

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

  const displayData = [...(data ?? []), ...(isLoading ? skeletonData : [])]

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
          loadMore={fetchNextPage}
          hasMore={hasNextPage}
          useWindow={false}
          initialLoad={false}
          threshold={SCROLL_THRESHOLD}
          getScrollParent={() => scrollParentRef.current}
        >
          {displayData.map((user, index) =>
            '_loading' in user ? (
              <div key={user.user_id} className={styles.userContainer}>
                Add loading skeleton
              </div>
            ) : (
              <div
                key={user.user_id}
                className={cn(styles.userContainer, {
                  [styles.notLastUser]: data && index !== data.length - 1
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
          {isLoading && <div className={styles.spacer} />}
          <div
            className={cn(styles.loadingAnimation, {
              [styles.show]: isLoading
            })}
          >
            <LoadingSpinner className={styles.spinner} />
          </div>
        </InfiniteScroll>
      </div>
    </Scrollbar>
  )
}
