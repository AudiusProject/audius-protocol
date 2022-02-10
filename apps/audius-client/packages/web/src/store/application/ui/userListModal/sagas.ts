import { takeEvery, put } from 'redux-saga/effects'

import { FavoriteType } from 'common/models/Favorite'
import * as favoritesActions from 'common/store/user-list/favorites/actions'
import * as followerActions from 'common/store/user-list/followers/actions'
import * as followingActions from 'common/store/user-list/following/actions'
import * as repostActions from 'common/store/user-list/reposts/actions'
import { RepostType } from 'common/store/user-list/reposts/types'

import { setUsers } from './slice'
import { UserListType, UserListEntityType } from './types'

function* watchSetUsers() {
  yield takeEvery(setUsers.type, function* (
    action: ReturnType<typeof setUsers>
  ) {
    const { userListType, entityType, id } = action.payload
    switch (userListType) {
      case UserListType.FAVORITE:
        yield put(
          favoritesActions.setFavorite(
            id,
            entityType === UserListEntityType.TRACK
              ? FavoriteType.TRACK
              : FavoriteType.PLAYLIST
          )
        )
        break
      case UserListType.REPOST:
        yield put(
          repostActions.setRepost(
            id,
            entityType === UserListEntityType.TRACK
              ? RepostType.TRACK
              : RepostType.COLLECTION
          )
        )
        break
      case UserListType.FOLLOWER:
        yield put(followerActions.setFollowers(id))
        break
      case UserListType.FOLLOWING:
        yield put(followingActions.setFollowing(id))
        break
      case UserListType.MUTUAL_FOLLOWER:
        break
      default:
        break
    }
  })
}

export default function sagas() {
  return [watchSetUsers]
}
