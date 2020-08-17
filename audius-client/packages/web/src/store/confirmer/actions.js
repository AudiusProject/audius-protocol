export const REQUEST_CONFIRMATION = 'CONFIRMER/REQUEST_CONFIRMATION'

export const ADD_CONFIRMATION_CALL = 'CONFIRMER/ADD_CONFIRMATION_CALL'
export const SET_CONFIRMATION_RESULT = 'CONFIRMER/SET_CONFIRMATION_RESULT'
export const ADD_COMPLETION_CALL = 'CONFIRMER/ADD_COMPLETION_CALL'
export const CLEAR = 'CONFIRMER/CLEAR'

const DEFAULT_TIMEOUT = 10 /* min */ * 60 /* sec */ * 1000 /* ms */

/**
 * Requests a confirmation of the result of an async call, dispatching success on completion or failure on timeout.
 * Should not be dispatched via UI, but rather a Saga/service/middleware.
 *
 * Confirmations with the same uid chain together. For example, if the following actions are dispatched in rapid succession:
 *  1. Create playlist
 *  2. Change playlist name
 *  3. Change playlist description
 * The calls are fired in order in such a way that each call makes use the result of the previous call's return value.
 *
 * TODO:
 *  - consider retries/timeout backoff
 *  - consider other mechanisms for failure other than timeout
 *
 * @param {string} uid A unique identifier for this confirmation (e.g. track id)
 * @param {function * | async function} confirmationCall The confirmation call to make. Can optionally receive the previous
 *  confirmation's result.
 * @param {?function * | ?async function | any} successCall An optional async call to make on success.
 *  It is invoked with the return value of the confirmation call.
 * @param {?function * | ?async function | any} failCall An optional async call to make on failure.
 * @param {function} previousResultSelector A selector to select content from the previous confirmation to pass to this one.
 * @param {number} timeoutMillis The millisecond timeout to await confirmation for.
 */
export function requestConfirmation(
  uid,
  confirmationCall,
  successCall = function* () {},
  failCall = function* () {},
  previousResultSelector = () => {},
  timeoutMillis = DEFAULT_TIMEOUT
) {
  return {
    type: REQUEST_CONFIRMATION,
    uid,
    confirmationCall,
    successCall,
    failCall,
    previousResultSelector,
    timeoutMillis
  }
}

/* Private */

// Enqueues a confirmation call to make, e.g. "create playlist with a temp id, wait for playlist to appear in discprov."
export function addConfirmationCall(uid, confirmationCall) {
  return { type: ADD_CONFIRMATION_CALL, uid, confirmationCall }
}
// Sets the result of a confirmation call, e.g. "save the discprov's returned playlist id"
export function setConfirmationResult(uid, result) {
  return { type: SET_CONFIRMATION_RESULT, uid, result }
}
// Enqueues a completion call to make, e.g. "cache the playlist"
export function addCompletionCall(uid, completionCall) {
  return { type: ADD_COMPLETION_CALL, uid, completionCall }
}
// Clears the queue for a given uid
export function clear(uid) {
  return { type: CLEAR, uid }
}
