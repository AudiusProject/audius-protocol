import { useEffect, useState, useCallback } from 'react'

import { useCurrentUserId } from '@audius/common/api'
import { ID, FollowSource } from '@audius/common/models'
import {
  TOP_SUPPORTERS_USER_LIST_TAG,
  SUPPORTING_USER_LIST_TAG,
  accountSelectors,
  cacheUsersSelectors,
  profilePageActions,
  usersSocialActions as socialActions,
  userListActions,
  userListSelectors,
  UserListStoreState
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { FollowButton } from '@audius/harmony'
import cn from 'classnames'
import InfiniteScroll from 'react-infinite-scroller'
import Lottie from 'react-lottie'
import { useDispatch, useSelector } from 'react-redux'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import ArtistChip from 'components/artist/ArtistChip'
import { MountPlacement } from 'components/types'
import * as unfollowConfirmationActions from 'components/unfollow-confirmation-modal/store/actions'
import { useIsMobile } from 'hooks/useIsMobile'
import { AppState } from 'store/types'
import { push } from 'utils/navigation'

import styles from './UserList.module.css'

const { profilePage } = route
const { makeGetOptimisticUserIdsIfNeeded } = userListSelectors
const { loadMore, reset } = userListActions
const { getUsers } = cacheUsersSelectors
const { setNotificationSubscription } = profilePageActions
const { getHasAccount } = accountSelectors

const SCROLL_THRESHOLD = 400

type UserListProps = {
  // A tag uniquely identifying this particular instance of a UserList in the store.
  // Because multiple lists may exist, all listening to the same actions,
  // the tag is required to forward actions to a particular UserList.
  tag: string
  // Selector pointing to this particular instance of the UserList in the global store.
  stateSelector: (state: AppState) => UserListStoreState
  // Selector pointing to relevant userId in the context of this modal
  userIdSelector?: (state: AppState) => ID | null
  // Optional sideeffects on/before performing actions
  afterFollow?: () => void
  afterUnfollow?: () => void
  beforeClickArtistName?: () => void
  getScrollParent?: () => HTMLElement | null
  onNavigateAway?: () => void
}

export const UserList = ({
  tag,
  stateSelector,
  userIdSelector,
  afterFollow,
  afterUnfollow,
  beforeClickArtistName,
  getScrollParent,
  onNavigateAway
}: UserListProps) => {
  const dispatch = useDispatch()
  const isMobile = useIsMobile()
  const [hasLoaded, setHasLoaded] = useState(false)

  const { hasMore, loading, userIds } = useSelector(stateSelector)
  const loggedIn = useSelector(getHasAccount)
  const { data: userId } = useCurrentUserId()
  const otherUserId = useSelector(
    (state: AppState) => userIdSelector?.(state) ?? undefined
  )
  const getOptimisticUserIds = makeGetOptimisticUserIdsIfNeeded({
    userIds,
    tag
  })
  const optimisticUserIds = useSelector(getOptimisticUserIds)
  const usersMap = useSelector((state: AppState) =>
    getUsers(state, { ids: optimisticUserIds })
  )
  const users = optimisticUserIds
    .map((id) => usersMap[id])
    .filter(Boolean)
    .filter((u) => !u.is_deactivated)

  const handleFollow = (userId: ID) => {
    dispatch(socialActions.followUser(userId, FollowSource.USER_LIST))
    if (!loggedIn && afterFollow) afterFollow()
  }

  const handleUnfollow = (userId: ID) => {
    if (isMobile) {
      dispatch(unfollowConfirmationActions.setOpen(userId))
    } else {
      dispatch(socialActions.unfollowUser(userId, FollowSource.USER_LIST))
      dispatch(setNotificationSubscription(userId, false, false))
    }
    if (!loggedIn && afterUnfollow) afterUnfollow()
  }

  const handleClickArtistName = (handle: string) => {
    beforeClickArtistName?.()
    dispatch(push(profilePage(handle)))
  }

  const handleLoadMore = useCallback(
    () => dispatch(loadMore(tag)),
    [dispatch, tag]
  )
  const handleReset = useCallback(() => dispatch(reset(tag)), [dispatch, tag])

  useEffect(() => {
    if (!hasLoaded) {
      /**
       * Reset on initial load in case the list modal for the
       * given tag was already open before for another user.
       * If we do no reset on initial load (or on exiting the modal),
       * then the list modal will be confused and may not refresh
       * for the current user, or it may refresh but not have the
       * correct total count which messes up the logic for loading
       * more users as we scroll down the modal.
       * The reason why we reset on initial load rather than on
       * exiting the modal is because it's possible that one modal
       * opens another (e.g. clicking artist hover tile supporting section),
       * and resetting on modal exit in that case may reset the data for the
       * incoming modal after it loads and end up showing an empty modal.
       */
      handleReset()
      handleLoadMore()
      setHasLoaded(true)
    }
  }, [handleLoadMore, handleReset, hasLoaded])

  return (
    <div className={styles.content}>
      <InfiniteScroll
        pageStart={0}
        loadMore={handleLoadMore}
        hasMore={hasMore}
        useWindow={!getScrollParent}
        initialLoad={false}
        threshold={SCROLL_THRESHOLD}
        getScrollParent={getScrollParent}
      >
        {users.map((user, index) => (
          <div
            key={user.user_id}
            className={cn(styles.user, {
              [styles.notLastUser]: index !== users.length - 1
            })}
          >
            <ArtistChip
              user={user}
              onClickArtistName={() => {
                handleClickArtistName(user.handle)
              }}
              onNavigateAway={onNavigateAway}
              showPopover={!isMobile}
              popoverMount={MountPlacement.BODY}
              showSupportFor={
                tag === TOP_SUPPORTERS_USER_LIST_TAG ? otherUserId : undefined
              }
              showSupportFrom={
                tag === SUPPORTING_USER_LIST_TAG ? otherUserId : undefined
              }
            />
            {user.user_id !== userId ? (
              <FollowButton
                size='small'
                isFollowing={user.does_current_user_follow}
                onFollow={() => handleFollow(user.user_id)}
                onUnfollow={() => handleUnfollow(user.user_id)}
                fullWidth={false}
              />
            ) : null}
          </div>
        ))}
        {/* Only show the spacer if we're in fullscreen mode (no getScrollParent) */}
        {loading && !getScrollParent && <div className={styles.spacer} />}
        <div
          className={cn(styles.loadingAnimation, {
            [styles.show]: loading
          })}
        >
          <Lottie
            options={{
              loop: true,
              autoplay: true,
              animationData: loadingSpinner
            }}
          />
        </div>
      </InfiniteScroll>
    </div>
  )
}
