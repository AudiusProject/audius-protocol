import { full } from '@audius/sdk'
import { omit } from 'lodash'
import snakecaseKeys from 'snakecase-keys'

import {
  PlaylistTrackId,
  UserCollectionMetadata,
  Variant
} from '~/models/Collection'
import { Copyright } from '~/models/Track'
import { decodeHashId } from '~/utils/hashIds'

import { accessConditionsFromSDK } from './access'
import { resourceContributorFromSDK } from './attribution'
import { favoriteListFromSDK } from './favorite'
import { coverArtSizesCIDsFromSDK } from './imageSize'
import { repostListFromSDK } from './repost'
import { userTrackMetadataFromSDK } from './track'
import { userMetadataFromSDK } from './user'
import { transformAndCleanList } from './utils'

const addedTimestampToPlaylistTrackId = ({
  timestamp,
  trackId,
  metadataTimestamp
}: full.PlaylistAddedTimestamp): PlaylistTrackId | null => {
  const decoded = decodeHashId(trackId)
  if (decoded) {
    return {
      track: decoded,
      time: timestamp,
      metadata_time: metadataTimestamp
    }
  }
  return null
}

export const userCollectionMetadataFromSDK = (
  input: full.PlaylistFullWithoutTracks
): UserCollectionMetadata | undefined => {
  const collection = snakecaseKeys(input)
  const decodedPlaylistId = decodeHashId(collection.id)
  const decodedOwnerId = decodeHashId(collection.user_id)
  const user = userMetadataFromSDK(collection.user)
  if (!decodedPlaylistId || !decodedOwnerId || !user) {
    return undefined
  }

  const newCollection: UserCollectionMetadata = {
    // Fields from API that are omitted in this model
    ...omit(collection, [
      'id',
      'user_id',
      'followee_favorites',
      'artwork',
      'favorite_count',
      'added_timestamps'
    ]),

    variant: Variant.USER_GENERATED,

    // Nested Transformed Fields
    artists: collection.artists
      ? transformAndCleanList(collection.artists, resourceContributorFromSDK)
      : null,
    copyright_line: collection.copyright_line
      ? (snakecaseKeys(collection.copyright_line) as Copyright)
      : null,
    cover_art_cids: collection.cover_art_cids
      ? coverArtSizesCIDsFromSDK(collection.cover_art_cids)
      : null,
    followee_reposts: repostListFromSDK(collection.followee_reposts),
    followee_saves: favoriteListFromSDK(collection.followee_favorites),
    playlist_contents: {
      track_ids: transformAndCleanList(
        collection.added_timestamps,
        addedTimestampToPlaylistTrackId
      )
    },
    playlist_id: decodedPlaylistId,
    playlist_owner_id: decodedOwnerId,
    producer_copyright_line: collection.producer_copyright_line
      ? (snakecaseKeys(collection.producer_copyright_line) as Copyright)
      : null,
    stream_conditions: collection.stream_conditions
      ? accessConditionsFromSDK(collection.stream_conditions)
      : null,
    tracks: transformAndCleanList(collection.tracks, userTrackMetadataFromSDK),
    user,

    // Retypes / Renames
    save_count: collection.favorite_count,

    // Nullable fields
    cover_art: collection.cover_art ?? null,
    cover_art_sizes: collection.cover_art_sizes ?? null,
    description: collection.description ?? null,
    release_date: collection.release_date ?? null
  }

  return newCollection
}
