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
import { favoriteListFromSDK } from './favorite'
import { coverArtSizesCIDsFromSDK } from './imageSize'
import { remixListFromSDK } from './remix'
import { repostListFromSDK } from './repost'
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
  const track = snakecaseKeys(input)
  const decodedTrackId = decodeHashId(track.id)
  const decodedOwnerId = decodeHashId(track.user_id)
  const user = userMetadataFromSDK(track.user)
  if (!decodedTrackId || !decodedOwnerId || !user) {
    return undefined
  }

  const remixes = remixListFromSDK(track.remix_of?.tracks)

  const newTrack: UserTrackMetadata = {
    // Fields from API that are omitted in this model
    ...omit(track, [
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
    release_date: track.release_date
      ? dayjs
          .utc(track.release_date)
          .local()
          // utc -> local
          .format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ')
      : null,

    // Nested Transformed Fields
    cover_art_cids: track.cover_art_cids
      ? coverArtSizesCIDsFromSDK(track.cover_art_cids)
      : null,
    download_conditions: track.download_conditions
      ? accessConditionsFromSDK(track.download_conditions)
      : null,
    field_visibility: snakecaseKeys(track.field_visibility),
    followee_saves: favoriteListFromSDK(track.followee_favorites),
    followee_reposts: repostListFromSDK(track.followee_reposts),
    remix_of:
      remixes.length > 0
        ? {
            tracks: remixes
          }
        : null,
    stem_of: input.stemOf
      ? {
          category: input.stemOf.category as StemCategory,
          parent_track_id: input.stemOf.parentTrackId
        }
      : undefined,
    stream_conditions: track.stream_conditions
      ? accessConditionsFromSDK(track.stream_conditions)
      : null,
    track_segments: track.track_segments.map(trackSegmentFromSDK),
    user,

    // Retypes
    license: (track.license as License) ?? null,

    // Nullable fields
    ai_attribution_user_id: track.ai_attribution_user_id ?? null,
    artists: track.artists
      ? transformAndCleanList(track.artists, resourceContributorFromSDK)
      : null,
    copyright_line: track.copyright_line
      ? (snakecaseKeys(track.copyright_line) as Copyright)
      : null,
    cover_art: track.cover_art ?? null,
    cover_art_sizes: track.cover_art_sizes ?? null,
    credits_splits: track.credits_splits ?? null,
    description: track.description ?? null,
    has_current_user_reposted: track.has_current_user_reposted ?? false,
    has_current_user_saved: track.has_current_user_saved ?? false,
    indirect_resource_contributors: track.indirect_resource_contributors
      ? transformAndCleanList(
          track.indirect_resource_contributors,
          resourceContributorFromSDK
        )
      : null,
    is_delete: track.is_delete ?? false,
    isrc: track.isrc ?? null,
    iswc: track.iswc ?? null,
    mood: track.mood ?? null,
    orig_file_cid: track.orig_file_cid ?? null,
    tags: track.tags ?? null,
    track_cid: track.track_cid ?? null,
    orig_filename: track.orig_filename ?? null,
    producer_copyright_line: track.producer_copyright_line
      ? (snakecaseKeys(track.producer_copyright_line) as Copyright)
      : null,
    repost_count: track.repost_count ?? 0,
    resource_contributors: track.resource_contributors
      ? transformAndCleanList(
          track.resource_contributors,
          resourceContributorFromSDK
        )
      : null,
    rights_controller: track.rights_controller
      ? (snakecaseKeys(track.rights_controller) as RightsController)
      : null,
    save_count: track.favorite_count ?? 0
  }

  return newTrack
}
