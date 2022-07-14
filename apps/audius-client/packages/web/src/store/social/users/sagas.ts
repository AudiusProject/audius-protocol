import { ID } from '@audius/common'
import { call, select, takeEvery, put } from 'typed-redux-saga/macro'

import { Name } from 'common/models/Analytics'
import Kind from 'common/models/Kind'
import { getUserId } from 'common/store/account/selectors'
import * as cacheActions from 'common/store/cache/actions'
import { adjustUserField } from 'common/store/cache/users/sagas'
import { getUsers, getUser } from 'common/store/cache/users/selectors'
import * as socialActions from 'common/store/social/users/actions'
import { makeKindId } from 'common/utils/uid'
import * as signOnActions from 'pages/sign-on/store/actions'
import AudiusBackend from 'services/AudiusBackend'
import { make } from 'store/analytics/actions'
import { waitForBackendSetup } from 'store/backend/sagas'
import * as confirmerActions from 'store/confirmer/actions'
import { confirmTransaction } from 'store/confirmer/sagas'
import { profilePage } from 'utils/route'
import { share } from 'utils/share'

import errorSagas from './errorSagas'

/* FOLLOW */

export function* watchFollowUser() {
  yield* takeEvery(socialActions.FOLLOW_USER, followUser)
}

export function* followUser(
  action: ReturnType<typeof socialActions.followUser>
) {
  /* Make Async Backend Call */
  yield* call(waitForBackendSetup)
  const accountId = yield* select(getUserId)
  if (!accountId) {
    yield* put(signOnActions.openSignOn(false))
    yield* put(signOnActions.showRequiresAccountModal())
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  const users = yield* select(getUsers, { ids: [action.userId, accountId] })
  const followedUser = users[action.userId]
  const currentUser = users[accountId]

  if (followedUser) {
    // Increment the followed user's follower count
    yield* put(
      cacheActions.update(Kind.USERS, [
        {
          id: action.userId,
          metadata: {
            does_current_user_follow: true,
            follower_count: followedUser.follower_count + 1
          }
        }
      ])
    )
  }
  // Increment the signed in user's followee count
  yield* call(adjustUserField, {
    user: currentUser,
    fieldName: 'followee_count',
    delta: 1
  })

  const event = make(Name.FOLLOW, { id: action.userId, source: action.source })
  yield* put(event)

  yield* call(confirmFollowUser, action.userId, accountId)
}

export function* confirmFollowUser(userId: ID, accountId: ID) {
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.USERS, userId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          AudiusBackend.followUser,
          userId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm follow user for user id ${userId} and account id ${accountId}`
          )
        }
        return accountId
      },
      function* () {
        yield* put(socialActions.followUserSucceeded(userId))
      },
      function* ({ timeout, message }: { timeout: boolean; message: string }) {
        yield* put(
          socialActions.followUserFailed(userId, timeout ? 'Timeout' : message)
        )
        const users = yield* select(getUsers, { ids: [userId, accountId] })
        const followedUser = users[userId]
        const currentUser = users[accountId]
        if (followedUser) {
          // Revert the incremented follower count on the followed user
          yield* put(
            cacheActions.update(Kind.USERS, [
              {
                id: userId,
                metadata: {
                  does_current_user_follow: false,
                  follower_count: followedUser.follower_count - 1
                }
              }
            ])
          )
        }

        // Revert the incremented followee count on the current user
        yield* call(adjustUserField, {
          user: currentUser,
          fieldName: 'followee_count',
          delta: -1
        })
      }
    )
  )
}

export function* watchUnfollowUser() {
  yield* takeEvery(socialActions.UNFOLLOW_USER, unfollowUser)
}

export function* unfollowUser(
  action: ReturnType<typeof socialActions.unfollowUser>
) {
  /* Make Async Backend Call */
  yield* call(waitForBackendSetup)
  const accountId = yield* select(getUserId)
  if (!accountId) {
    yield* put(signOnActions.openSignOn(false))
    yield* put(signOnActions.showRequiresAccountModal())
    yield* put(make(Name.CREATE_ACCOUNT_OPEN, { source: 'social action' }))
    return
  }

  const users = yield* select(getUsers, { ids: [action.userId, accountId] })
  const unfollowedUser = users[action.userId]
  const currentUser = users[accountId]

  // Decrement the follower count on the unfollowed user
  yield* put(
    cacheActions.update(Kind.USERS, [
      {
        id: action.userId,
        metadata: {
          does_current_user_follow: false,
          follower_count: unfollowedUser.follower_count - 1
        }
      }
    ])
  )

  // Decrement the followee count on the current user
  yield* call(adjustUserField, {
    user: currentUser,
    fieldName: 'followee_count',
    delta: -1
  })

  const event = make(Name.UNFOLLOW, {
    id: action.userId,
    source: action.source
  })
  yield* put(event)

  yield* call(confirmUnfollowUser, action.userId, accountId)
}

export function* confirmUnfollowUser(userId: ID, accountId: ID) {
  yield* put(
    confirmerActions.requestConfirmation(
      makeKindId(Kind.USERS, userId),
      function* () {
        const { blockHash, blockNumber } = yield* call(
          AudiusBackend.unfollowUser,
          userId
        )
        const confirmed = yield* call(
          confirmTransaction,
          blockHash,
          blockNumber
        )
        if (!confirmed) {
          throw new Error(
            `Could not confirm unfollow user for user id ${userId} and account id ${accountId}`
          )
        }
        return accountId
      },
      function* () {
        yield* put(socialActions.unfollowUserSucceeded(userId))
      },
      function* ({ timeout, message }: { timeout: boolean; message: string }) {
        yield* put(
          socialActions.unfollowUserFailed(
            userId,
            timeout ? 'Timeout' : message
          )
        )
        const users = yield* select(getUsers, { ids: [userId, accountId] })
        const unfollowedUser = users[userId]
        const currentUser = users[accountId]

        // Revert decremented follower count on unfollowed user
        yield* put(
          cacheActions.update(Kind.USERS, [
            {
              id: userId,
              metadata: {
                does_current_user_follow: true,
                follower_count: unfollowedUser.follower_count + 1
              }
            }
          ])
        )

        // Revert decremented followee count on current user
        yield* call(adjustUserField, {
          user: currentUser,
          fieldName: 'followee_count',
          delta: 1
        })
      }
    )
  )
}

export function* watchShareUser() {
  yield* takeEvery(
    socialActions.SHARE_USER,
    function* (action: ReturnType<typeof socialActions.shareUser>) {
      const { userId, source } = action

      const user = yield* select(getUser, { id: userId })
      if (!user) return

      const link = profilePage(user.handle)
      share(link, user.name)

      const event = make(Name.SHARE, {
        kind: 'profile',
        id: userId,
        url: link,
        source
      })
      yield* put(event)
    }
  )
}

const sagas = () => {
  return [watchFollowUser, watchUnfollowUser, watchShareUser, errorSagas]
}

export default sagas
