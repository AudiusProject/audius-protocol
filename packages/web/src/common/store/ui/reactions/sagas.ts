import { removeNullable } from '@audius/common'
import { call, takeEvery, all, put, select } from 'typed-redux-saga/macro'

import { apiClient } from 'services/audius-api-client'
import { submitReaction } from 'services/audius-backend/Reactions'

import {
  fetchReactionValues,
  getReactionFromRawValue,
  makeGetReactionForSignature,
  reactionsMap,
  setLocalReactionValues,
  writeReactionValue
} from './slice'

function* fetchReactionValuesAsync({
  payload
}: ReturnType<typeof fetchReactionValues>) {
  // Fetch reactions
  // TODO: [PAY-305] This endpoint should be fixed to properly allow multiple reaction fetches
  const reactions = yield* all(
    payload.entityIds.map((id) =>
      call([apiClient, apiClient.getReaction], {
        reactedToIds: [id]
      })
    )
  )

  // Add them to the store
  // Many of these reactions may be null (i.e. entity not reacted to), ignore them
  const toUpdate = reactions
    .filter(removeNullable)
    .map(({ reactedTo, reactionValue }) => ({
      reaction: getReactionFromRawValue(reactionValue), // this may be null if reaction state is 0 (unsent)
      entityId: reactedTo
    }))

  yield put(setLocalReactionValues({ reactions: toUpdate }))
}

function* writeReactionValueAsync({
  payload
}: ReturnType<typeof writeReactionValue>) {
  const { entityId, reaction } = payload
  if (!reaction) {
    return
  }

  // If we're toggling a reaction, set it to null
  const existingReaction = yield* select(makeGetReactionForSignature(entityId))
  const newReactionValue = existingReaction === reaction ? null : reaction

  yield put(
    setLocalReactionValues({
      reactions: [{ reaction: newReactionValue, entityId }]
    })
  )

  yield call(submitReaction, {
    reactedTo: entityId,
    reactionValue: newReactionValue ? reactionsMap[newReactionValue] : 0
  })
}

function* watchFetchReactionValues() {
  yield* takeEvery(fetchReactionValues.type, fetchReactionValuesAsync)
}

function* watchWriteReactionValues() {
  yield* takeEvery(writeReactionValue.type, writeReactionValueAsync)
}

const sagas = () => {
  return [watchFetchReactionValues, watchWriteReactionValues]
}

export default sagas
