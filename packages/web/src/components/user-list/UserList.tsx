import { useEffect, useState, useCallback } from 'react'

import { FollowSource, ID } from '@audius/common/models'
import {
  accountSelectors,
  cacheUsersSelectors,
  profilePageActions,
  usersSocialActions as socialActions,
  userListActions,
  userListSelectors,
  UserListStoreState
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'

import * as unfollowConfirmationActions from 'components/unfollow-confirmation-modal/store/actions'
import { useIsMobile } from 'hooks/useIsMobile'
import { AppState } from 'store/types'

import UserList from './components/UserList'

const { profilePage } = route
const { makeGetOptimisticUserIdsIfNeeded } = userListSelectors
const { loadMore, reset } = userListActions
const { getUsers } = cacheUsersSelectors
const { setNotificationSubscription } = profilePageActions
const getUserId = accountSelectors.getUserId

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

const ConnectedUserList = ({
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
  const userId = useSelector(getUserId)
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
    if (!userId && afterFollow) afterFollow()
  }

  const handleUnfollow = (userId: ID) => {
    if (isMobile) {
      dispatch(unfollowConfirmationActions.setOpen(userId))
    } else {
      dispatch(socialActions.unfollowUser(userId, FollowSource.USER_LIST))
      dispatch(setNotificationSubscription(userId, false, false))
    }
    if (!userId && afterUnfollow) afterUnfollow()
  }

  const handleClickArtistName = (handle: string) => {
    beforeClickArtistName?.()
    dispatch(pushRoute(profilePage(handle)))
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
    <UserList
      hasMore={hasMore}
      onFollow={handleFollow}
      onUnfollow={handleUnfollow}
      users={users}
      loading={loading}
      userId={userId}
      onClickArtistName={handleClickArtistName}
      loadMore={handleLoadMore}
      isMobile={isMobile}
      getScrollParent={getScrollParent}
      tag={tag}
      otherUserId={otherUserId}
      onNavigateAway={onNavigateAway}
    />
  )
}

export default ConnectedUserList
