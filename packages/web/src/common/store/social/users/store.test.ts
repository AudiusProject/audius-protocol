import { FollowSource, Kind } from '@audius/common/models'
import {
  cacheActions,
  usersSocialActions as actions
} from '@audius/common/store'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import * as matchers from 'redux-saga-test-plan/matchers'
import { StaticProvider } from 'redux-saga-test-plan/providers'
import { describe, it } from 'vitest'

import { adjustUserField } from 'common/store/cache/users/sagas'
import * as sagas from 'common/store/social/users/sagas'
import { noopReducer } from 'store/testHelper'
import { waitForWrite } from 'utils/sagaHelpers'

const followedUser = { follower_count: 5 }
const accountUser = { followee_count: 1 }

const mockAudiusSdk = {}

const defaultProviders: StaticProvider[] = [
  [call.fn(waitForWrite), undefined],
  [matchers.getContext('audiusSdk'), async () => mockAudiusSdk]
]

describe('follow', () => {
  it('follows', async () => {
    await expectSaga(sagas.watchFollowUser)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          users: {
            entries: {
              2: { metadata: followedUser },
              1: { metadata: accountUser }
            }
          }
        }
      )
      .provide(defaultProviders)
      .dispatch(actions.followUser(2, FollowSource.PROFILE_PAGE))
      .call(adjustUserField, {
        user: accountUser,
        fieldName: 'followee_count',
        delta: 1
      })
      .call(sagas.confirmFollowUser, 2, 1, undefined)
      .put(
        cacheActions.update(Kind.USERS, [
          {
            id: 2,
            metadata: {
              does_current_user_follow: true,
              follower_count: 6
            }
          }
        ])
      )
      .silentRun()
  })

  it('unfollows', async () => {
    await expectSaga(sagas.watchUnfollowUser)
      .withReducer(
        combineReducers({
          account: noopReducer(),
          users: noopReducer()
        }),
        {
          account: {
            userId: 1
          },
          users: {
            entries: {
              2: { metadata: followedUser },
              1: { metadata: accountUser }
            }
          }
        }
      )
      .provide(defaultProviders)
      .dispatch(actions.unfollowUser(2, FollowSource.PROFILE_PAGE))
      .call(sagas.confirmUnfollowUser, 2, 1)
      .put(
        cacheActions.update(Kind.USERS, [
          {
            id: 2,
            metadata: {
              does_current_user_follow: false,
              follower_count: 4
            }
          }
        ])
      )
      .silentRun()
  })
})
