import { ID, Id, OptionalId } from '@audius/common/models'
import {
  cacheTracksActions,
  getContext,
  accountSelectors,
  gatedContentSelectors,
  cacheTracksSelectors,
  queueSelectors,
  calculatePlayerBehavior,
  getSDK
} from '@audius/common/store'
import { getQueryParams } from '@audius/common/utils'
import { all, call, select, put, delay, fork, cancel } from 'typed-redux-saga'
const { getUserId } = accountSelectors
const { getTrackStreamUrl, getTrack } = cacheTracksSelectors
const { setStreamUrls } = cacheTracksActions
const { getNftAccessSignatureMap } = gatedContentSelectors
const { getPlayerBehavior } = queueSelectors

export function* fetchTrackStreamUrls({
  trackIds,
  isUpdate
}: {
  trackIds: ID[]
  isUpdate?: boolean
}) {
  const sdk = yield* getSDK()
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const reportToSentry = yield* getContext('reportToSentry')
  const playerBehavior = yield* select(getPlayerBehavior)
  const currentUserId = yield* select(getUserId)

  try {
    const earlyResultsArr: { [id: number]: string | undefined }[] = []
    // TODO: Long term it probably makes more sense to batch these fetches (needs a backend change to support)
    const streamUrlCallEffects = trackIds.map((id) =>
      call(function* () {
        try {
          const existingUrl = yield* select(getTrackStreamUrl, id)

          if (existingUrl && !isUpdate) {
            return { [id]: existingUrl }
          }

          const track = yield* select(getTrack, { id })
          const { shouldSkip, shouldPreview } = calculatePlayerBehavior(
            track,
            playerBehavior
          )

          if (shouldSkip) {
            return undefined
          }
          const nftAccessSignatureMap = yield* select(getNftAccessSignatureMap)
          const nftAccessSignature = nftAccessSignatureMap[id]?.mp3 ?? null
          const queryParams = yield* call(getQueryParams, {
            audiusBackendInstance,
            nftAccessSignature,
            userId: currentUserId
          })

          const { user_data, user_signature, nft_access_signature } =
            queryParams
          const { data: streamUrl } = yield* call(
            [sdk.tracks, sdk.tracks.streamTrack],
            {
              trackId: Id.parse(id),
              userId: OptionalId.parse(currentUserId),
              noRedirect: true,
              preview: shouldPreview,
              userData: user_data as string,
              userSignature: user_signature as string,
              nftAccessSignature: nft_access_signature as string
            }
          )

          earlyResultsArr.push({ [id]: streamUrl })
          return streamUrl !== undefined ? { [id]: streamUrl } : undefined
        } catch (e) {
          reportToSentry({
            error: e as Error,
            name: 'Stream Prefetch',
            additionalInfo: { trackId: id }
          })
        }
      })
    )
    // Intentionally don't use yield* so we don't block here
    const streamUrlResults = all(streamUrlCallEffects)

    let earlyResultsObj: { [id: number]: string | undefined } = {}

    // This early results handler is an optimization to make sure that if any particular network request is taking longer than 1.5s,
    // we don't hold up the rest of the requests. This code waits for 1.5s and puts whatever is ready at the time
    // @ts-ignore
    function* earlyResultsHandler() {
      yield* delay(1500)
      if (earlyResultsArr.length > 0) {
        // Convert array to obj and remove undefined values
        earlyResultsObj = earlyResultsArr.reduce((acc, curr) => {
          if (Object.values(curr)[0] === undefined) {
            return acc
          }

          return { ...acc, ...curr }
        }, {})
        // Put the early results in the store
        yield* put(setStreamUrls(earlyResultsObj))
      }
    }

    const getEarlyResultsFork = yield* fork(earlyResultsHandler)

    // Now we block and wait for all stream urls to come back
    const yieldedResults = yield* streamUrlResults

    // Filter out the results that we already put earlier
    const slowerResultsArr = yieldedResults.filter(
      (track) =>
        track !== undefined &&
        earlyResultsObj[Object.keys(track)[0]] === undefined
    )
    if (slowerResultsArr.length > 0) {
      const slowerResultsObj = slowerResultsArr.reduce((acc, curr) => {
        // Check for any undefined values early
        if (curr === undefined || Object.values(curr)[0] === undefined) {
          return acc
        }
        return { ...acc, ...curr }
      }, {}) as { [id: number]: string } // from array of objs to one obj
      yield* put(setStreamUrls(slowerResultsObj))
    }

    yield* cancel(getEarlyResultsFork)
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
