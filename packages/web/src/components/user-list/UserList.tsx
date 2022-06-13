import { useEffect } from 'react'

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
import {
  getOptimisticSupporters,
  getOptimisticSupporting,
  getSupportersOverrides,
  getSupportingOverrides
} from 'common/store/tipping/selectors'
import { loadMore, reset } from 'common/store/user-list/actions'
import { getId as getSupportingId } from 'common/store/user-list/supporting/selectors'
import { getId as getSupportersId } from 'common/store/user-list/top-supporters/selectors'
import { UserListStoreState } from 'common/store/user-list/types'
import { stringWeiToBN } from 'common/utils/wallet'
import * as unfollowConfirmationActions from 'components/unfollow-confirmation-modal/store/actions'
import { USER_LIST_TAG as SUPPORTING_USER_LIST_TAG } from 'pages/supporting-page/sagas'
import { USER_LIST_TAG as TOP_SUPPORTERS_USER_LIST_TAG } from 'pages/top-supporters-page/sagas'
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

  useEffect(() => {
    // Load initially
    loadMore()
  }, [loadMore])

  useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

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
    />
  )
}

function includeOptimisticUserIdsIfNeeded({
  state,
  userIds,
  tag
}: {
  state: AppState
  userIds: ID[]
  tag: string
}) {
  const userIdSet = new Set(userIds)

  if (tag === SUPPORTING_USER_LIST_TAG) {
    /**
     * Get supporting overrides for the user whose modal info is displayed.
     * If none, then return userIds as-is.
     */
    const userId = getSupportingId(state)
    if (!userId) {
      return userIds
    }

    const supportingOverridesMap = getSupportingOverrides(state)
    const supportingOverridesMapForUser = supportingOverridesMap[userId] || {}
    const supportingOverridesKeysForUser = Object.keys(
      supportingOverridesMapForUser
    ).map(k => parseInt(k))
    if (supportingOverridesKeysForUser.length === 0) {
      return userIds
    }

    /**
     * Include optimistic user ids that are not in userIds by getting
     * the optimistic supporting data, sorting by amount descending,
     * and checking the sorted ids in both the given userIds and the
     * optimistic user ids to include. This also preserves the sort
     * order and thus eventually displays the users correctly in the
     * supporting list modal.
     */
    const optimisticUserIdSetToInclude = new Set(
      supportingOverridesKeysForUser.filter(id => !userIdSet.has(id))
    )
    const optimisticSupporting = getOptimisticSupporting(state)
    const optimisticSupportingForUser = optimisticSupporting[userId]
    const optimisticSupportingForUserKeys = Object.keys(
      optimisticSupportingForUser
    ).map(k => parseInt(k))

    const sortedIdsDesc = optimisticSupportingForUserKeys.sort((k1, k2) => {
      const amount1BN = stringWeiToBN(optimisticSupportingForUser[k1].amount)
      const amount2BN = stringWeiToBN(optimisticSupportingForUser[k2].amount)
      return amount1BN.gte(amount2BN) ? -1 : 1
    })

    const resultIds: ID[] = []
    sortedIdsDesc.forEach(id => {
      if (userIdSet.has(id) || optimisticUserIdSetToInclude.has(id)) {
        resultIds.push(id)
      }
    })
    return resultIds
  } else if (tag === TOP_SUPPORTERS_USER_LIST_TAG) {
    /**
     * Get supporters overrides for the user whose modal info is displayed.
     * If none, then return userIds as-is.
     */
    const userId = getSupportersId(state)
    if (!userId) {
      return userIds
    }

    const supportersOverridesMap = getSupportersOverrides(state)
    const supportersOverridesMapForUser = supportersOverridesMap[userId] || {}
    const supportersOverridesKeysForUser = Object.keys(
      supportersOverridesMapForUser
    ).map(k => parseInt(k))
    if (supportersOverridesKeysForUser.length === 0) {
      return userIds
    }

    /**
     * Include optimistic user ids that are not in userIds by getting
     * the optimistic supporters data, sorting by amount descending,
     * and checking the sorted ids in both the given userIds and the
     * optimistic user ids to include. This also preserves the sort
     * order and thus eventually displays the users correctly in the
     * top supporters list modal.
     */
    const optimisticUserIdSetToInclude = new Set(
      supportersOverridesKeysForUser.filter(id => !userIdSet.has(id))
    ) as Set<number>
    const optimisticSupporters = getOptimisticSupporters(state)
    const optimisticSupportersForUser = optimisticSupporters[userId]
    const optimisticSupportersForUserKeys = Object.keys(
      optimisticSupportersForUser
    ).map(k => parseInt(k))

    const sortedIdsDesc = optimisticSupportersForUserKeys.sort((k1, k2) => {
      const amount1BN = stringWeiToBN(optimisticSupportersForUser[k1].amount)
      const amount2BN = stringWeiToBN(optimisticSupportersForUser[k2].amount)
      return amount1BN.gte(amount2BN) ? -1 : 1
    })

    const resultIds: ID[] = []
    sortedIdsDesc.forEach(id => {
      if (userIdSet.has(id) || optimisticUserIdSetToInclude.has(id)) {
        resultIds.push(id)
      }
    })
    return resultIds
  }

  return userIds
}

function mapStateToProps(state: AppState, ownProps: ConnectedUserListOwnProps) {
  const { hasMore, loading, userIds } = ownProps.stateSelector(state)
  const userId = getUserId(state)
  const optimisticUserIds = includeOptimisticUserIdsIfNeeded({
    state,
    userIds,
    tag: ownProps.tag
  })
  const usersMap: { [id: number]: User } = getUsers(state, {
    ids: optimisticUserIds
  })
  const users = optimisticUserIds
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
    reset: () => dispatch(reset(ownProps.tag))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedUserList)
