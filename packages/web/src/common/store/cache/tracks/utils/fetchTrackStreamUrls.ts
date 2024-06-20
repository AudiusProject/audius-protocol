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
const { setStreamUrls } = cacheTracksActions
const { getNftAccessSignatureMap } = gatedContentSelectors

export function* fetchTrackStreamUrls({
  trackIds,
  isUpdate
}: {
  trackIds: ID[]
  isUpdate?: boolean
}) {
  const apiClient = yield* getContext('apiClient')
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const reportToSentry = yield* getContext('reportToSentry')

  const currentUserId = yield* select(getUserId)

  try {
    // TODO: Ideally we should batch these fetches (needs a backend change to support)
    const streamUrlCallEffects = trackIds.map(function* (id: ID) {
      try {
        const existingUrl = yield* select(getTrackStreamUrl, id)

        if (existingUrl && !isUpdate) {
          return { [id]: existingUrl }
        }

        const nftAccessSignatureMap = yield* select(getNftAccessSignatureMap)
        const nftAccessSignature = nftAccessSignatureMap[id]?.mp3 ?? null
        const queryParams = yield* call(getQueryParams, {
          audiusBackendInstance,
          nftAccessSignature,
          userId: currentUserId
        })
        const streamUrl = yield* call([apiClient, 'getTrackStreamUrl'], {
          id,
          currentUserId,
          queryParams,
          abortOnUnreachable: true
        })
        return streamUrl !== undefined ? { [id]: streamUrl } : undefined
      } catch (e) {
        reportToSentry({
          error: e as Error,
          name: 'Stream Prefetch',
          additionalInfo: { trackId: id }
        })
      }
    })

    // Fetch stream urls concurrently
    const streamUrlArray = yield* all(streamUrlCallEffects)

    // Convert to an object & put it in the store
    const streamUrls = streamUrlArray.reduce(
      (acc, streamUrl) => ({ ...acc, ...streamUrl }),
      {}
    ) as { [trackId: ID]: string }
    yield* put(setStreamUrls(streamUrls))
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
