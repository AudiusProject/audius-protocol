import { call, put, takeLatest, select, all } from 'redux-saga/effects'

import * as userListActions from 'containers/user-list/store/actions'
import { AppState } from 'store/types'

import { FetchUserIdsSaga, UserListStoreState } from './types'

// Factory for creating UserList sagas that listen to a particular tag,
// call and arbitrary `fetchUsers` method, and handle errors via an `errorDispatcher` function.
const UserListSagaFactory = {
  createSagas: ({
    tag,
    fetchUsers,
    stateSelector,
    errorDispatcher
  }: {
    tag: string
    fetchUsers: FetchUserIdsSaga
    stateSelector: (state: AppState) => UserListStoreState
    errorDispatcher: (error: Error) => Generator<any, any, any>
  }) => {
    const loadMore = function* (
      action: ReturnType<typeof userListActions.loadMore>
    ) {
      try {
        if (action.tag !== tag) return
        const ownState: UserListStoreState = yield select(stateSelector)
        const { page, pageSize } = ownState
        const { userIds, hasMore } = yield call(fetchUsers, page, pageSize)
        yield all([
          put(userListActions.setUserIds(tag, userIds, hasMore)),
          put(userListActions.incrementPage(tag))
        ])
      } catch (e) {
        yield errorDispatcher(e)
      }
    }

    const watchLoadMore = function* () {
      yield takeLatest(userListActions.LOAD_MORE, loadMore)
    }
    return watchLoadMore
  }
}

export default UserListSagaFactory
