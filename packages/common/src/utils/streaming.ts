import { AudiusSdk } from '@audius/sdk'

import { AccessSignature, ID, OptionalId, Track } from '~/models'
import { AudiusBackend, QueryParams } from '~/services/index'

import { Nullable } from './typeUtils'

const PREVIEW_LENGTH_SECONDS = 30

export async function generateUserSignature(
  audiusBackendInstance: AudiusBackend,
  sdk: AudiusSdk
) {
  const data = `Gated content user signature at ${Date.now()}`
  return await audiusBackendInstance.getSignature({ data, sdk })
}

export async function getQueryParams({
  audiusBackendInstance,
  sdk,
  nftAccessSignature,
  userId
}: {
  audiusBackendInstance: AudiusBackend
  nftAccessSignature?: Nullable<AccessSignature>
  userId?: Nullable<ID>
  sdk: AudiusSdk
}) {
  const { data, signature } = await generateUserSignature(
    audiusBackendInstance,
    sdk
  )
  const queryParams: QueryParams = {}
  if (userId) {
    queryParams.user_id = OptionalId.parse(userId)
  }
  queryParams.user_data = data
  queryParams.user_signature = signature
  if (nftAccessSignature) {
    queryParams.nft_access_signature = JSON.stringify(nftAccessSignature)
  }
  return queryParams
}

export function getTrackPreviewDuration(track: Track) {
  const previewStartSeconds = track.preview_start_seconds || 0
  return Math.min(track.duration - previewStartSeconds, PREVIEW_LENGTH_SECONDS)
}
