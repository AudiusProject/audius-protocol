import { full } from '@audius/sdk'
import dayjs from 'dayjs'
import { omit } from 'lodash'
import snakecaseKeys from 'snakecase-keys'

import {
  Copyright,
  RightsController,
  StemCategory,
  TrackSegment
} from '~/models'
import { UserTrackMetadata } from '~/models/Track'
import { License } from '~/utils'
import { decodeHashId } from '~/utils/hashIds'

import { accessConditionsFromSDK } from './access'
import { resourceContributorFromSDK } from './attribution'
import { favoriteFromSDK } from './favorite'
import { coverArtSizesCIDsFromSDK } from './imageSize'
import { remixFromSDK } from './remix'
import { repostFromSDK } from './repost'
import { userMetadataFromSDK } from './user'
import { transformAndCleanList } from './utils'

export const trackSegmentFromSDK = ({
  duration,
  multihash
}: full.TrackSegment): TrackSegment => ({
  // Client code expects duration as a string
  duration: `${duration}`,
  multihash
})

export const userTrackMetadataFromSDK = (
  input: full.TrackFull
): UserTrackMetadata | undefined => {
  const decodedTrackId = decodeHashId(input.id)
  const decodedOwnerId = decodeHashId(input.userId)
  const user = userMetadataFromSDK(input.user)
  if (!decodedTrackId || !decodedOwnerId || !user) {
    return undefined
  }

  const remixes = transformAndCleanList(input.remixOf?.tracks, remixFromSDK)

  const newTrack: UserTrackMetadata = {
    // Fields from API that are omitted in this model
    ...omit(snakecaseKeys(input), [
      'id',
      'user_id',
      'followee_favorites',
      'artwork',
      'favorite_count',
      'is_streamable'
    ]),

    // Conversions
    track_id: decodedTrackId,
    owner_id: decodedOwnerId,
    release_date: input.releaseDate
      ? dayjs
          .utc(input.releaseDate)
          .local()
          // utc -> local
          .format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ')
      : null,

    // Nested Transformed Fields
    cover_art_cids: input.coverArtCids
      ? coverArtSizesCIDsFromSDK(input.coverArtCids)
      : null,
    download_conditions: input.downloadConditions
      ? accessConditionsFromSDK(input.downloadConditions)
      : null,
    field_visibility: snakecaseKeys(input.fieldVisibility),
    followee_saves: transformAndCleanList(
      input.followeeFavorites,
      favoriteFromSDK
    ),
    followee_reposts: transformAndCleanList(
      input.followeeReposts,
      repostFromSDK
    ),
    remix_of:
      remixes.length > 0
        ? {
            tracks: remixes
          }
        : null,
    stem_of: input.stemOf?.parentTrackId
      ? {
          category: input.stemOf.category as StemCategory,
          parent_track_id: input.stemOf.parentTrackId
        }
      : undefined,
    stream_conditions: input.streamConditions
      ? accessConditionsFromSDK(input.streamConditions)
      : null,
    track_segments: input.trackSegments.map(trackSegmentFromSDK),
    user,

    // Retypes
    license: (input.license as License) ?? null,

    // Nullable fields
    ai_attribution_user_id: input.aiAttributionUserId ?? null,
    allowed_api_keys: input.allowedApiKeys ?? null,
    artists: input.artists
      ? transformAndCleanList(input.artists, resourceContributorFromSDK)
      : null,
    audio_upload_id: input.audioUploadId ?? null,
    copyright_line: input.copyrightLine
      ? (snakecaseKeys(input.copyrightLine) as Copyright)
      : null,
    cover_art: input.coverArt ?? null,
    create_date: input.createDate ?? null,
    credits_splits: input.creditsSplits ?? null,
    ddex_app: input.ddexApp ?? null,
    ddex_release_ids: input.ddexReleaseIds ?? null,
    description: input.description ?? null,
    indirect_resource_contributors: input.indirectResourceContributors
      ? transformAndCleanList(
          input.indirectResourceContributors,
          resourceContributorFromSDK
        )
      : null,
    isrc: input.isrc ?? null,
    iswc: input.iswc ?? null,
    mood: input.mood ?? null,
    orig_file_cid: input.origFileCid ?? null,
    tags: input.tags ?? null,
    track_cid: input.trackCid ?? null,
    orig_filename: input.origFilename ?? null,
    parental_warning_type: input.parentalWarningType ?? null,
    preview_cid: input.previewCid ?? null,
    preview_start_seconds: input.previewStartSeconds ?? null,
    producer_copyright_line: input.producerCopyrightLine
      ? (snakecaseKeys(input.producerCopyrightLine) as Copyright)
      : null,
    resource_contributors: input.resourceContributors
      ? transformAndCleanList(
          input.resourceContributors,
          resourceContributorFromSDK
        )
      : null,
    rights_controller: input.rightsController
      ? (snakecaseKeys(input.rightsController) as RightsController)
      : null,
    save_count: input.favoriteCount
  }

  return newTrack
}
