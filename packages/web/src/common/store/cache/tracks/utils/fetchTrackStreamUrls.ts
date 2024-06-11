import { ID } from '@audius/common/models'
import {
  cacheTracksActions,
  getContext,
  accountSelectors,
  gatedContentSelectors,
  cacheTracksSelectors
} from '@audius/common/store'
import { getQueryParams } from '@audius/common/utils'
import { all, call, select, put } from 'typed-redux-saga'
const { getUserId } = accountSelectors
const { getTrackStreamUrl } = cacheTracksSelectors
const { setStreamUrl } = cacheTracksActions
const { getNftAccessSignatureMap } = gatedContentSelectors

export function* fetchTrackStreamUrls({ trackIds }: { trackIds: ID[] }) {
  const apiClient = yield* getContext('apiClient')
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const reportToSentry = yield* getContext('reportToSentry')

  const currentUserId = yield* select(getUserId)

  try {
    // TODO: Ideally we should batch this method (needs a backend change to support)
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
          // Set the stream url in the cache
          yield* put(setStreamUrl(id, streamUrl))
        }
        return streamUrl
      } catch (e) {
        reportToSentry({
          error: e as Error,
          name: 'Stream Prefetch',
          additionalInfo: { trackId: id }
        })
      }
    })

    // Fetch all stream urls in parallel
    yield* all(callEffects)
  } catch (e) {
    reportToSentry({
      error: e as Error,
      name: 'Stream Prefetch',
      additionalInfo: {
        trackIds
      }
    })
  }

  return null
}
