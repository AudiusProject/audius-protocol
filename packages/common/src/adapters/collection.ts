import {
  CreateAlbumMetadata,
  CreatePlaylistMetadata,
  full,
  UpdatePlaylistRequest
} from '@audius/sdk'
import dayjs from 'dayjs'
import { omit } from 'lodash'
import snakecaseKeys from 'snakecase-keys'

import { Id } from '~/models'
import {
  AccountCollection,
  Collection,
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
    artwork: input.artwork
      ? {
          '150x150': input.artwork._150x150,
          '480x480': input.artwork._480x480,
          '1000x1000': input.artwork._1000x1000,
          mirrors: input.artwork.mirrors
        }
      : {},
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

export const playlistMetadataForCreateWithSDK = (
  input: Collection
): CreatePlaylistMetadata => {
  return {
    playlistName: input.playlist_name ?? '',
    description: input.description ?? '',
    coverArtCid: input.cover_art_sizes ?? '',
    isPrivate: input.is_private ?? false,
    license: input.ddex_app ?? '',
    releaseDate: input.release_date ? new Date(input.release_date) : undefined,
    ddexReleaseIds: input.ddex_release_ids ?? null,
    ddexApp: input.ddex_app ?? '',
    upc: input.upc ?? '',
    artists: input.artists ?? null,
    copyrightLine: input.copyright_line ?? null,
    producerCopyrightLine: input.producer_copyright_line ?? null,
    parentalWarningType: input.parental_warning_type ?? null
  }
}

export const playlistMetadataForUpdateWithSDK = (
  input: Collection
): UpdatePlaylistRequest['metadata'] => {
  return {
    ...playlistMetadataForCreateWithSDK(input),
    playlistContents: input.playlist_contents
      ? input.playlist_contents.track_ids.map((t) => ({
          timestamp: t.time,
          trackId: Id.parse(t.track),
          metadataTimestamp: t.metadata_time
        }))
      : undefined,
    playlistName: input.playlist_name ?? '',
    description: input.description ?? '',
    coverArtCid: input.cover_art_sizes ?? '',
    isPrivate: input.is_private ?? false
  }
}

export const albumMetadataForSDK = (input: Collection): CreateAlbumMetadata => {
  return {
    albumName: input.playlist_name ?? '',
    description: input.description ?? '',
    license: input.ddex_app ?? '',
    releaseDate: input.release_date ? new Date(input.release_date) : undefined,
    ddexReleaseIds: input.ddex_release_ids ?? null,
    ddexApp: input.ddex_app ?? '',
    upc: input.upc ?? '',
    artists: input.artists ?? null,
    copyrightLine: input.copyright_line ?? null,
    producerCopyrightLine: input.producer_copyright_line ?? null,
    parentalWarningType: input.parental_warning_type ?? null
  }
}
