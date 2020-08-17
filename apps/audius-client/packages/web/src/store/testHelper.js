import { all, fork, take, takeEvery } from 'redux-saga/effects'

export const noopReducer = initialState => (
  state = initialState || {},
  action
) => state

export function* noopSaga() {}

export const takeSaga = action => {
  return function* () {
    yield take(action)
  }
}

export const takeEverySaga = action => {
  return function* () {
    yield takeEvery(action, function* () {})
  }
}

export const allSagas = sagas => {
  return function* () {
    yield all(sagas.map(saga => fork(saga)))
  }
}
