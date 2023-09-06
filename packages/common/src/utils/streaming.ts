import { select } from 'typed-redux-saga'

import { PremiumContentSignature, Track } from 'models'
import { AudiusBackend, QueryParams } from 'services/index'
import { premiumContentSelectors } from 'store/premium-content'

import { Nullable } from './typeUtils'

const { getPremiumTrackSignatureMap } = premiumContentSelectors

const PREVIEW_LENGTH_SECONDS = 30

export async function generateUserSignature(
  audiusBackendInstance: AudiusBackend
) {
  const data = `Premium content user signature at ${Date.now()}`
  const signature = await audiusBackendInstance.getSignature(data)
  return { data, signature }
}

export async function getQueryParams({
  audiusBackendInstance,
  premiumContentSignature
}: {
  audiusBackendInstance: AudiusBackend
  premiumContentSignature: Nullable<PremiumContentSignature>
}) {
  const { data, signature } = await generateUserSignature(audiusBackendInstance)
  const queryParams: QueryParams = {}
  queryParams.user_data = data
  queryParams.user_signature = signature
  if (premiumContentSignature) {
    queryParams.premium_content_signature = JSON.stringify(
      premiumContentSignature
    )
  }
  return queryParams
}

export function* doesUserHaveTrackAccess(track: Nullable<Track>) {
  const premiumTrackSignatureMap = yield* select(getPremiumTrackSignatureMap)

  const {
    track_id: trackId,
    is_premium: isPremium,
    premium_content_signature: premiumContentSignature
  } = track ?? {}

  const hasPremiumContentSignature =
    !!premiumContentSignature ||
    !!(trackId && premiumTrackSignatureMap[trackId])

  return !isPremium || hasPremiumContentSignature
}

export function getTrackPreviewDuration(track: Track) {
  const previewStartSeconds = track.preview_start_seconds || 0
  return Math.min(track.duration - previewStartSeconds, PREVIEW_LENGTH_SECONDS)
}
