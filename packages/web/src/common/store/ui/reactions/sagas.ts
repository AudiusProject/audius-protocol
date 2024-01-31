import { AudiusBackend } from '@audius/common/services'
import {
  reactionsUIActions,
  reactionsUISelectors,
  reactionsMap,
  getReactionFromRawValue,
  getContext
} from '@audius/common/store'
import { getErrorMessage, removeNullable } from '@audius/common/utils'
import { call, takeEvery, all, put, select } from 'typed-redux-saga'

const { fetchReactionValues, setLocalReactionValues, writeReactionValue } =
  reactionsUIActions
const { makeGetReactionForSignature } = reactionsUISelectors

type SubmitReactionConfig = {
  reactedTo: string
  reactionValue: number
  audiusBackend: AudiusBackend
}

type SubmitReactionResponse = { success: boolean; error: any }

const submitReaction = async ({
  reactedTo,
  reactionValue,
  audiusBackend
}: SubmitReactionConfig): Promise<SubmitReactionResponse> => {
  try {
    const libs = await audiusBackend.getAudiusLibs()
    return libs.Reactions.submitReaction({ reactedTo, reactionValue })
  } catch (err) {
    const errorMessage = getErrorMessage(err)
    console.error(errorMessage)
    return { success: false, error: errorMessage }
  }
}

function* fetchReactionValuesAsync({
  payload
}: ReturnType<typeof fetchReactionValues>) {
  const apiClient = yield* getContext('apiClient')
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

  const audiusBackend = yield* getContext('audiusBackendInstance')

  yield* call(submitReaction, {
    reactedTo: entityId,
    reactionValue: newReactionValue ? reactionsMap[newReactionValue] : 0,
    audiusBackend
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
