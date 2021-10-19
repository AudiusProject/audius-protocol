import { takeEvery, put } from 'redux-saga/effects'

import { FavoriteType } from 'common/models/Favorite'
import * as favoritesActions from 'containers/favorites-page/store/actions'
import * as followerActions from 'containers/followers-page/store/actions'
import * as repostActions from 'containers/reposts-page/store/actions'
import { RepostType } from 'containers/reposts-page/store/types'

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
      default:
        break
    }
  })
}

export default function sagas() {
  return [watchSetUsers]
}
