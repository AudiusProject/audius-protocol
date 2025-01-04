import { all, fork } from 'redux-saga/effects'

export const noopReducer =
  (initialState) =>
  (state = initialState || {}, action) =>
    state

export const allSagas = (sagas) => {
  return function* () {
    yield all(sagas.map((saga) => fork(saga)))
  }
}
