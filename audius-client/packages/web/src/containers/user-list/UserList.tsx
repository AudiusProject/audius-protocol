import React, { useEffect } from 'react'

import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { FollowSource } from 'common/models/Analytics'
import { ID } from 'common/models/Identifiers'
import { User } from 'common/models/User'
import { getUserId } from 'common/store/account/selectors'
import { getUsers } from 'common/store/cache/users/selectors'
import * as socialActions from 'common/store/social/users/actions'
import { setNotificationSubscription } from 'containers/profile-page/store/actions'
import * as unfollowConfirmationActions from 'containers/unfollow-confirmation-modal/store/actions'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'
import { profilePage } from 'utils/route'

import UserList from './components/UserList'
import { loadMore, setPageSize } from './store/actions'
import { UserListStoreState } from './store/types'

type ConnectedUserListOwnProps = {
  // A tag uniquely identifying this particular instance of a UserList in the store.
  // Because multiple lists may exist, all listening to the same actions,
  // the tag is required to forward actions to a particular UserList.
  tag: string

  // # of items per page.
  pageSize: number

  // Selector pointing to this particular instance of the UserList in the global store.
  stateSelector: (state: AppState) => UserListStoreState

  // Optional sideeffects on/before performing actions
  afterFollow?: () => void
  afterUnfollow?: () => void
  beforeClickArtistName?: () => void
  getScrollParent?: () => HTMLElement | null
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

  const { setPageSize, loadMore, pageSize } = props

  useEffect(() => {
    // Load initially
    setPageSize(pageSize)
    loadMore()
  }, [setPageSize, loadMore, pageSize])

  // If page size changes, set it in the store
  useEffect(() => {
    setPageSize(pageSize)
  }, [setPageSize, pageSize])

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
    />
  )
}

function mapStateToProps(state: AppState, ownProps: ConnectedUserListOwnProps) {
  const { hasMore, loading, userIds } = ownProps.stateSelector(state)
  const userId = getUserId(state)
  const usersMap: { [id: number]: User } = getUsers(state, { ids: userIds })
  const users = userIds
    .map(id => usersMap[id])
    .filter(Boolean)
    .filter(u => !u.is_deactivated)
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
    setPageSize: (pageSize: number) =>
      dispatch(setPageSize(ownProps.tag, pageSize))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedUserList)
