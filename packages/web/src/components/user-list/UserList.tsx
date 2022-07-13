import { useEffect, useState } from 'react'

import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { FollowSource } from 'common/models/Analytics'
import { ID } from 'common/models/Identifiers'
import { User } from 'common/models/User'
import { getUserId } from 'common/store/account/selectors'
import { getUsers } from 'common/store/cache/users/selectors'
import { setNotificationSubscription } from 'common/store/pages/profile/actions'
import * as socialActions from 'common/store/social/users/actions'
import { loadMore, reset } from 'common/store/user-list/actions'
import { makeGetOptimisticUserIdsIfNeeded } from 'common/store/user-list/selectors'
import { UserListStoreState } from 'common/store/user-list/types'
import * as unfollowConfirmationActions from 'components/unfollow-confirmation-modal/store/actions'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'
import { profilePage } from 'utils/route'

import UserList from './components/UserList'

type ConnectedUserListOwnProps = {
  // A tag uniquely identifying this particular instance of a UserList in the store.
  // Because multiple lists may exist, all listening to the same actions,
  // the tag is required to forward actions to a particular UserList.
  tag: string

  // Selector pointing to this particular instance of the UserList in the global store.
  stateSelector: (state: AppState) => UserListStoreState

  // Optional sideeffects on/before performing actions
  afterFollow?: () => void
  afterUnfollow?: () => void
  beforeClickArtistName?: () => void
  getScrollParent?: () => HTMLElement | null
  onNavigateAway?: () => void
}

type ConnectedUserListProps = ConnectedUserListOwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const ConnectedUserList = (props: ConnectedUserListProps) => {
  const onFollow = (userId: ID) => {
    props.onFollow(userId)
    if (!props.loggedIn && props.afterFollow) props.afterFollow()
  }

  const onUnfollow = (userId: ID) => {
    props.onUnfollow(userId)
    if (!props.loggedIn && props.afterUnfollow) props.afterUnfollow()
  }

  const onClickArtistName = (handle: string) => {
    props.beforeClickArtistName && props.beforeClickArtistName()
    props.onClickArtistName(handle)
  }

  const { loadMore, reset } = props

  const [hasLoaded, setHasLoaded] = useState(false)

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
      reset()
      loadMore()
      setHasLoaded(true)
    }
  }, [reset, hasLoaded, loadMore])

  return (
    <UserList
      hasMore={props.hasMore}
      onFollow={onFollow}
      onUnfollow={onUnfollow}
      users={props.users}
      loading={props.loading}
      userId={props.userId}
      onClickArtistName={onClickArtistName}
      loadMore={props.loadMore}
      isMobile={props.isMobile}
      getScrollParent={props.getScrollParent}
      tag={props.tag}
      onNavigateAway={props.onNavigateAway}
    />
  )
}

function mapStateToProps(state: AppState, ownProps: ConnectedUserListOwnProps) {
  const { hasMore, loading, userIds } = ownProps.stateSelector(state)
  const userId = getUserId(state)
  const getOptimisticUserIds = makeGetOptimisticUserIdsIfNeeded({
    userIds,
    tag: ownProps.tag
  })
  const optimisticUserIds = getOptimisticUserIds(state)
  const usersMap: { [id: number]: User } = getUsers(state, {
    ids: optimisticUserIds
  })
  const users = optimisticUserIds
    .map((id) => usersMap[id])
    .filter(Boolean)
    .filter((u) => !u.is_deactivated)
  return {
    loggedIn: !!userId,
    userId,
    users,
    hasMore,
    loading,
    isMobile: isMobile()
  }
}

function mapDispatchToProps(
  dispatch: Dispatch,
  ownProps: ConnectedUserListOwnProps
) {
  const mobile = isMobile()
  return {
    onFollow: (userId: ID) =>
      dispatch(socialActions.followUser(userId, FollowSource.USER_LIST)),
    onUnfollow: (userId: ID) => {
      if (mobile) {
        dispatch(unfollowConfirmationActions.setOpen(userId))
      } else {
        dispatch(socialActions.unfollowUser(userId, FollowSource.USER_LIST))
        dispatch(setNotificationSubscription(userId, false, true))
      }
    },
    onClickArtistName: (handle: string) =>
      dispatch(pushRoute(profilePage(handle))),
    loadMore: () => dispatch(loadMore(ownProps.tag)),
    reset: () => dispatch(reset(ownProps.tag))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedUserList)
