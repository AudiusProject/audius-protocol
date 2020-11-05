import { delay } from 'redux-saga'
import { call, put, race, select, takeEvery } from 'redux-saga/effects'

import AudiusBackend from 'services/AudiusBackend'
import { waitForValue } from 'utils/sagaHelpers'
import * as confirmerActions from 'store/confirmer/actions'
import {
  getResult,
  getCommandChain,
  getIndexEquals,
  getConfirmLength,
  getIsDone
} from 'store/confirmer/selectors'
import apiClient from 'services/audius-api-client/AudiusAPIClient'
import { getUserId } from 'store/account/selectors'

const POLLING_FREQUENCY_MILLIS = 2000

/* Exported  */

/**
 * Polls a playlist in discprov and checks for existence as well as whether a custom check
 * on the playlist is fulfilled.
 * @param {number} playlistId
 * @param {?number} userId playlist owner id. Can be null ONLY if the playlist is PUBLIC.
 * @param {function} check single argument function that takes a playlist and returns a boolean.
 */
export function* pollPlaylist(
  playlistId,
  userId,
  check = playlist => playlist
) {
  let playlists = yield call(AudiusBackend.getPlaylists, userId, [playlistId])
  while (playlists.length === 0 || !check(playlists[0])) {
    yield delay(POLLING_FREQUENCY_MILLIS)
    playlists = yield call(AudiusBackend.getPlaylists, userId, [playlistId])
  }
  return playlists[0]
}

/**
 * Polls a track in discprov and checks for existence as well as whether a custom check
 * on the track is fulfilled.
 * @param {number} trackId
 * @param {function} check single argument function that takes a track and returns a boolean.
 */
export function* pollTrack(
  trackId,
  trackTitle,
  handle,
  check = track => track
) {
  const userId = yield select(getUserId)

  function* fetchTrack() {
    return yield call(
      args => {
        try {
          return apiClient.getTrack(args, /* retry */ false)
        } catch (e) {
          // TODO: for now we treat all errors from DP
          // here as cause to retry, we should just
          // retry for 404s
          return null
        }
      },
      {
        id: trackId,
        currentUserId: userId,
        unlistedArgs: {
          urlTitle: trackTitle,
          handle
        }
      }
    )
  }
  let track = yield call(fetchTrack)
  while (!(track && check(track))) {
    yield delay(POLLING_FREQUENCY_MILLIS)
    track = yield call(fetchTrack)
  }
  return track
}

/**
 * Polls a user in discprov and checks for existence as well as whether a custom check
 * on the user is fulfilled.
 * @param {number} userId
 * @param {function} check single argument function that takes a user and returns a boolean.
 */
export function* pollUser(userId, check = user => user) {
  let users = yield call(AudiusBackend.getCreators, [userId])
  while (users.length === 0 || !check(users[0])) {
    yield delay(POLLING_FREQUENCY_MILLIS)
    users = yield call(AudiusBackend.getCreators, [userId])
  }
  return users[0]
}

/* Private */

// Makes a call and races a confirmation callback against a timeout, enqueues requests with
// matching uid's and allows them to resolve sequentially.
function* requestConfirmationAsync(action) {
  const {
    uid,
    confirmationCall,
    successCall,
    failCall,
    previousResultSelector,
    timeoutMillis
  } = action

  // Get the "queue" length
  const length = yield select(getConfirmLength, { uid: uid })

  yield put(confirmerActions.addConfirmationCall(uid, confirmationCall))

  // Wait for previous call
  yield call(waitForValue, getIndexEquals, { uid: uid, index: length })
  const previousCallResult = yield call(waitForValue, getResult, {
    uid: uid,
    index: length - 1
  })
  let result, completionCall
  try {
    const { confirmationResult, timeout } = yield race({
      confirmationResult: call(
        confirmationCall,
        previousResultSelector(previousCallResult)
      ),
      timeout: delay(timeoutMillis, true)
    })
    if (!timeout) {
      result = confirmationResult
      completionCall = successCall
    } else {
      result = { error: true, timeout: true }
      completionCall = failCall
    }
  } catch (err) {
    console.debug(`Caught error in confirmer: ${err}`)
    result = { error: true, message: err.message, timeout: false }
    completionCall = failCall
  }

  yield put(confirmerActions.setConfirmationResult(uid, result))
  yield put(
    confirmerActions.addCompletionCall(uid, call(completionCall, result))
  )

  // if no children
  const isDone = yield select(getIsDone, { uid: uid })
  if (isDone) {
    const commandChain = yield select(getCommandChain, { uid: uid })
    for (let i = 0; i < commandChain.length; ++i) {
      yield commandChain[i]
    }
    yield put(confirmerActions.clear(uid))
  }
}

export function* watchRequestConfirmation() {
  yield takeEvery(
    confirmerActions.REQUEST_CONFIRMATION,
    requestConfirmationAsync
  )
}

export default function sagas() {
  return [watchRequestConfirmation]
}
