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
  tag: string
  stateSelector: (state: AppState) => UserListStoreState
  userIdSelector?: (state: AppState) => ID | null
  afterFollow?: () => void
  afterUnfollow?: () => void
  beforeClickArtistName?: () => void
  getScrollParent?: () => HTMLElement | null
  onNavigateAway?: () => void
}

const UserListContainer = ({
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

export default UserListContainer
