import { getContext, accountSelectors, CommonState } from '@audius/common/store'
import { all, call, select, put } from 'typed-redux-saga'
import { ID } from '@audius/common/models'
import { getQueryParams } from '@audius/common/utils'
import { setStreamUrl } from '@audius/common/src/store/cache/tracks/actions'
import { getNftAccessSignatureMap } from '@audius/common/src/store/gated-content/selectors'
import { getTrackStreamUrl } from '@audius/common/src/store/cache/selectors'
const getUserId = accountSelectors.getUserId

export function* fetchTrackStreamUrls({ trackIds }: { trackIds: ID[] }) {
  const apiClient = yield* getContext('apiClient')
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')

  const currentUserId = yield* select(getUserId)

  try {
    // TODO: this should ideally have some batching logic instead of individual tracks
    const callEffects = trackIds.map(function* (id) {
      try {
        const existingUrl = yield* select(getTrackStreamUrl, id)

        if (existingUrl) {
          return existingUrl
        }

        const nftAccessSignatureMap = yield* select(getNftAccessSignatureMap)
        const nftAccessSignature = nftAccessSignatureMap[id]?.mp3 ?? null
        const queryParams = yield* call(getQueryParams, {
          audiusBackendInstance,
          nftAccessSignature
        })
        const streamUrl = yield* call([apiClient, 'getTrackStreamUrl'], {
          id,
          currentUserId,
          queryParams,
          abortOnUnreachable: true
        })
        if (streamUrl !== undefined) {
          console.log('DEBUG: got info for trackId ', id)
          // Set the stream url in the cache
          yield* put(setStreamUrl(id, streamUrl))
        }
        return streamUrl
      } catch (e) {
        console.error('ERROR WITH TRACK ID: ', id, e)
      }
    })

    // Fetch all stream urls in parallel
    const results = yield* all(callEffects)

    console.log('STREAM URLS: ', results)
  } catch (error) {
    // TODO: error logging/handling
    console.error(error)
  }

  return null
}
