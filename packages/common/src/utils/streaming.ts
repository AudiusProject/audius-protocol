import { select } from 'typed-redux-saga'

import { StreamingSignature, Track } from 'models'
import { AudiusBackend, QueryParams } from 'services/index'
import { gatedContentSelectors } from 'store/gated-content'

import { Nullable } from './typeUtils'

const { getGatedTrackSignatureMap } = gatedContentSelectors

const PREVIEW_LENGTH_SECONDS = 30

export async function generateUserSignature(
  audiusBackendInstance: AudiusBackend
) {
  const data = `Gated content user signature at ${Date.now()}`
  const signature = await audiusBackendInstance.getSignature(data)
  return { data, signature }
}

export async function getQueryParams({
  audiusBackendInstance,
  streamSignature
}: {
  audiusBackendInstance: AudiusBackend
  streamSignature: Nullable<StreamingSignature>
}) {
  const { data, signature } = await generateUserSignature(audiusBackendInstance)
  const queryParams: QueryParams = {}
  queryParams.user_data = data
  queryParams.user_signature = signature
  if (streamSignature) {
    queryParams.stream_signature = JSON.stringify(
      streamSignature
    )
  }
  return queryParams
}

export function* doesUserHaveTrackAccess(track: Nullable<Track>) {
  const gatedTrackSignatureMap = yield* select(getGatedTrackSignatureMap)

  const {
    track_id: trackId,
    is_stream_gated: isStreamGated,
    stream_signature: streamSignature
  } = track ?? {}

  const hasStreamSignature =
    !!streamSignature ||
    !!(trackId && gatedTrackSignatureMap[trackId])

  return !isStreamGated || hasStreamSignature
}

export function getTrackPreviewDuration(track: Track) {
  const previewStartSeconds = track.preview_start_seconds || 0
  return Math.min(track.duration - previewStartSeconds, PREVIEW_LENGTH_SECONDS)
}
