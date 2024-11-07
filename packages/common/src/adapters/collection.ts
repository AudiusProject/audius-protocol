import { full } from '@audius/sdk'
import dayjs from 'dayjs'
import { omit } from 'lodash'
import snakecaseKeys from 'snakecase-keys'

import {
  AccountCollection,
  PlaylistTrackId,
  UserCollectionMetadata,
  Variant
} from '~/models/Collection'
import { Copyright } from '~/models/Track'
import { decodeHashId } from '~/utils/hashIds'

import { accessConditionsFromSDK } from './access'
import { resourceContributorFromSDK } from './attribution'
import { favoriteFromSDK } from './favorite'
import { coverArtSizesCIDsFromSDK } from './imageSize'
import { repostFromSDK } from './repost'
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
  input:
    | full.PlaylistFullWithoutTracks
    | full.SearchPlaylistFull
    | full.PlaylistFull
): UserCollectionMetadata | undefined => {
  const decodedPlaylistId = decodeHashId(input.id)
  const decodedOwnerId = decodeHashId(input.userId ?? input.user.id)
  const user = userMetadataFromSDK(input.user)
  if (!decodedPlaylistId || !decodedOwnerId || !user) {
    return undefined
  }

  const newCollection: UserCollectionMetadata = {
    // Fields from API that are omitted in this model
    ...omit(snakecaseKeys(input), [
      'id',
      'user_id',
      'followee_favorites',
      'favorite_count',
      'added_timestamps'
    ]),
    artwork: input.artwork ?? {},

    variant: Variant.USER_GENERATED,

    // Conversions
    playlist_id: decodedPlaylistId,
    playlist_owner_id: decodedOwnerId,
    // TODO: Remove this when api is fixed to return UTC dates
    release_date: input.releaseDate
      ? dayjs.utc(input.releaseDate).local().toString()
      : null,

    // Nested Transformed Fields
    artists: input.artists
      ? transformAndCleanList(input.artists, resourceContributorFromSDK)
      : null,
    copyright_line: input.copyrightLine
      ? (snakecaseKeys(input.copyrightLine) as Copyright)
      : null,
    cover_art_cids: input.coverArtCids
      ? coverArtSizesCIDsFromSDK(input.coverArtCids)
      : null,
    followee_reposts: transformAndCleanList(
      input.followeeReposts,
      repostFromSDK
    ),
    followee_saves: transformAndCleanList(
      input.followeeFavorites,
      favoriteFromSDK
    ),
    playlist_contents: {
      track_ids: transformAndCleanList(
        input.addedTimestamps ?? input.playlistContents,
        addedTimestampToPlaylistTrackId
      )
    },
    producer_copyright_line: input.producerCopyrightLine
      ? (snakecaseKeys(input.producerCopyrightLine) as Copyright)
      : null,
    stream_conditions: input.streamConditions
      ? accessConditionsFromSDK(input.streamConditions)
      : null,
    tracks: transformAndCleanList(input.tracks, userTrackMetadataFromSDK),
    user,

    // Retypes / Renames
    save_count: input.favoriteCount,

    // Nullable fields
    cover_art: input.coverArt ?? null,
    cover_art_sizes: input.coverArtSizes ?? null,
    description: input.description ?? null
  }

  return newCollection
}

export const accountCollectionFromSDK = (
  input: full.AccountCollection
): AccountCollection | undefined => {
  const playlistId = decodeHashId(input.id)
  const userId = decodeHashId(input.user.id)
  if (!playlistId || !userId) {
    return undefined
  }

  return {
    id: playlistId,
    is_album: input.isAlbum,
    name: input.name,
    permalink: input.permalink,
    user: {
      id: userId,
      handle: input.user.handle,
      is_deactivated: !!input.user.isDeactivated
    }
  }
}
