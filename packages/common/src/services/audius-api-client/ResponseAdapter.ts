import { full } from '@audius/sdk'

import dayjs from '~/utils/dayjs'

import {
  ID,
  UserCollectionMetadata,
  Variant,
  Favorite,
  Repost,
  Remix,
  StemTrackMetadata,
  TrackMetadata,
  UserTrackMetadata,
  UserMetadata,
  StringWei
} from '../../models'
import { decodeHashId } from '../../utils/hashIds'
import { removeNullable } from '../../utils/typeUtils'

import {
  APIActivity,
  APIFavorite,
  APIRemix,
  APIRepost,
  APITrack,
  APIPlaylist,
  APISearchUser,
  APIUser,
  APIStem,
  APIResponse,
  APISearch,
  APISearchTrack,
  APISearchAutocomplete,
  APISearchPlaylist,
  APIActivityV2,
  isApiActivityV2
} from './types'

export const makeUser = (
  user: APISearchUser | APIUser
): UserMetadata | undefined => {
  const decodedUserId = decodeHashId(user.id)
  if (!decodedUserId) {
    return undefined
  }

  const decoded_artist_pick_track_id = user.artist_pick_track_id
    ? decodeHashId(user.artist_pick_track_id)
    : null
  const balance = user.balance as StringWei
  const associated_wallets_balance =
    user.associated_wallets_balance as StringWei
  const album_count = 'album_count' in user ? user.album_count : 0
  const followee_count = 'followee_count' in user ? user.followee_count : 0
  const follower_count = 'follower_count' in user ? user.follower_count : 0
  const playlist_count = 'playlist_count' in user ? user.playlist_count : 0
  const repost_count = 'repost_count' in user ? user.repost_count : 0
  const track_count = 'track_count' in user ? user.track_count : 0
  const current_user_followee_follow_count =
    'current_user_followee_follow_count' in user
      ? user.current_user_followee_follow_count
      : 0
  const does_current_user_follow =
    'does_current_user_follow' in user ? user.does_current_user_follow : false
  const supporter_count = user.supporter_count ?? 0
  const supporting_count = user.supporting_count ?? 0

  const newUser = {
    ...user,
    artist_pick_track_id: decoded_artist_pick_track_id,
    balance,
    associated_wallets_balance,
    album_count,
    followee_count,
    follower_count,
    playlist_count,
    repost_count,
    track_count,
    current_user_followee_follow_count,
    does_current_user_follow,
    user_id: decodedUserId,
    cover_photo: user.cover_photo_legacy,
    profile_picture: user.profile_picture_legacy,
    metadata_multihash: user.metadata_multihash || null,
    supporter_count,
    supporting_count,

    // Fields to prune
    id: undefined,
    cover_photo_legacy: undefined,
    profile_picture_legacy: undefined
  }

  delete newUser.id
  delete newUser.cover_photo_legacy
  delete newUser.profile_picture_legacy

  return newUser
}

export const makeFavorite = (favorite: APIFavorite): Favorite | undefined => {
  const { favorite_item_id, user_id, created_at } = favorite
  const decodedSaveItemId = decodeHashId(favorite_item_id)
  const decodedUserId = decodeHashId(user_id)
  if (!decodedSaveItemId || !decodedUserId) {
    return undefined
  }
  return {
    save_item_id: decodedSaveItemId,
    user_id: decodedUserId,
    save_type: favorite.favorite_type,
    created_at
  }
}

const makeRepost = (repost: APIRepost): Repost | undefined => {
  const decodedRepostItemId = decodeHashId(repost.repost_item_id)
  const decodedUserId = decodeHashId(repost.user_id)
  if (!decodedRepostItemId || !decodedUserId) {
    return undefined
  }

  return {
    repost_item_id: decodedRepostItemId,
    user_id: decodedUserId,
    repost_type: repost.repost_type
  }
}

const makeRemix = (remix: APIRemix): Remix | undefined => {
  const decodedTrackId = decodeHashId(remix.parent_track_id)
  const user = makeUser(remix.user)
  if (!decodedTrackId || !user) {
    return undefined
  }

  return {
    ...remix,
    parent_track_id: decodedTrackId,
    user
  }
}

export const makeUserlessTrack = (
  track: APITrack | APISearchTrack
): TrackMetadata | undefined => {
  const decodedTrackId = decodeHashId(track.id)
  const decodedOwnerId = decodeHashId(track.user_id)
  if (!decodedTrackId || !decodedOwnerId) return undefined

  const saves =
    'followee_favorites' in track
      ? track.followee_favorites?.map(makeFavorite).filter(removeNullable) ?? []
      : []

  const reposts =
    'followee_reposts' in track
      ? track.followee_reposts?.map(makeRepost).filter(removeNullable) ?? []
      : []

  const remixes =
    track.remix_of.tracks?.map(makeRemix).filter(removeNullable) ?? []
  const play_count =
    'play_count' in track
      ? typeof track.play_count === 'string'
        ? parseInt(track.play_count, 10)
        : track.play_count
      : 0
  const save_count = 'favorite_count' in track ? track.favorite_count : 0
  const repost_count = 'repost_count' in track ? track.repost_count : 0
  const has_current_user_reposted =
    'has_current_user_reposted' in track
      ? track.has_current_user_reposted
      : false
  const has_current_user_saved =
    'has_current_user_saved' in track ? track.has_current_user_saved : false
  const marshalled = {
    ...track,
    track_id: decodedTrackId,
    owner_id: decodedOwnerId,
    followee_saves: saves,
    followee_reposts: reposts,
    play_count,
    save_count,
    repost_count,
    has_current_user_reposted,
    has_current_user_saved,
    remix_of:
      remixes.length > 0
        ? {
            tracks: remixes
          }
        : null,

    stem_of: track.stem_of.parent_track_id === null ? null : track.stem_of,

    // Fields to prune
    id: undefined,
    user_id: undefined,
    followee_favorites: undefined,
    artwork: undefined,
    favorite_count: undefined
  }

  delete marshalled.id
  delete marshalled.user_id
  delete marshalled.followee_favorites
  delete marshalled.artwork
  delete marshalled.favorite_count

  return marshalled
}

export const makeTrack = (
  track: APITrack | APISearchTrack
): UserTrackMetadata | undefined => {
  const decodedTrackId = decodeHashId(track.id)
  const decodedOwnerId = decodeHashId(track.user_id)
  const user = makeUser(track.user)
  if (!decodedTrackId || !decodedOwnerId || !user) {
    return undefined
  }

  const saves =
    'followee_favorites' in track
      ? track.followee_favorites?.map(makeFavorite).filter(removeNullable) ?? []
      : []

  const reposts =
    'followee_reposts' in track
      ? track.followee_reposts?.map(makeRepost).filter(removeNullable) ?? []
      : []

  const remixes =
    track.remix_of.tracks?.map(makeRemix).filter(removeNullable) ?? []
  const play_count =
    'play_count' in track
      ? typeof track.play_count === 'string'
        ? parseInt(track.play_count, 10)
        : track.play_count
      : 0

  const save_count = 'favorite_count' in track ? track.favorite_count : 0
  const repost_count = 'repost_count' in track ? track.repost_count : 0
  const has_current_user_reposted =
    'has_current_user_reposted' in track
      ? track.has_current_user_reposted
      : false
  const has_current_user_saved =
    'has_current_user_saved' in track ? track.has_current_user_saved : false
  const marshalled = {
    ...track,
    user,
    track_id: decodedTrackId,
    owner_id: decodedOwnerId,
    followee_saves: saves,
    followee_reposts: reposts,
    play_count,
    save_count,
    repost_count,
    has_current_user_reposted,
    has_current_user_saved,
    remix_of:
      remixes.length > 0
        ? {
            tracks: remixes
          }
        : null,

    stem_of: track.stem_of.parent_track_id === null ? null : track.stem_of,
    release_date: dayjs
      .utc(track.release_date)
      .local()
      .format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ'), // utc -> local

    // Fields to prune
    id: undefined,
    user_id: undefined,
    followee_favorites: undefined,
    artwork: undefined,
    favorite_count: undefined,
    is_streamable: undefined
  }

  delete marshalled.id
  delete marshalled.user_id
  delete marshalled.followee_favorites
  delete marshalled.artwork
  delete marshalled.favorite_count
  delete marshalled.is_streamable
  return marshalled
}

export const makeTrackId = (track: { id: string }): ID | undefined => {
  const decodedTrackId = decodeHashId(track.id)
  if (!decodedTrackId) {
    return undefined
  }
  return decodedTrackId
}

export const makePlaylist = (
  playlist: APIPlaylist | APISearchPlaylist
): UserCollectionMetadata | undefined => {
  const decodedPlaylistId = decodeHashId(playlist.id)
  const decodedOwnerId = decodeHashId(playlist.user_id)
  const user = makeUser(playlist.user)
  if (!decodedPlaylistId || !decodedOwnerId || !user) {
    return undefined
  }

  const saves =
    'followee_favorites' in playlist
      ? playlist.followee_favorites?.map(makeFavorite).filter(removeNullable) ??
        []
      : []

  const reposts =
    'followee_reposts' in playlist
      ? playlist.followee_reposts?.map(makeRepost).filter(removeNullable) ?? []
      : []
  const has_current_user_reposted =
    'has_current_user_reposted' in playlist
      ? playlist.has_current_user_reposted
      : false
  const has_current_user_saved =
    'has_current_user_saved' in playlist
      ? playlist.has_current_user_saved
      : false
  const save_count = 'favorite_count' in playlist ? playlist.favorite_count : 0
  const repost_count = 'repost_count' in playlist ? playlist.repost_count : 0
  const total_play_count =
    'total_play_count' in playlist ? playlist.total_play_count : 0
  const track_count = 'track_count' in playlist ? playlist.track_count : 0

  const playlistContents = {
    track_ids: playlist.added_timestamps
      .map((ts) => {
        const decoded = decodeHashId(ts.track_id)
        if (decoded) {
          return {
            track: decoded,
            time: ts.timestamp,
            metadata_time: ts.metadata_timestamp
          }
        }
        return null
      })
      .filter(removeNullable)
  }

  const tracks =
    'tracks' in playlist
      ? playlist.tracks
          ?.map((track) => makeTrack(track))
          .filter(removeNullable) ?? []
      : []

  const marshalled = {
    ...playlist,
    variant: Variant.USER_GENERATED,
    user,
    tracks,
    playlist_id: decodedPlaylistId,
    playlist_owner_id: decodedOwnerId,
    followee_saves: saves,
    followee_reposts: reposts,
    has_current_user_reposted,
    has_current_user_saved,
    save_count,
    repost_count,
    track_count,
    total_play_count,
    playlist_contents: playlistContents,

    // Fields to prune
    id: undefined,
    user_id: undefined,
    followee_favorites: undefined,
    artwork: undefined,
    favorite_count: undefined,
    added_timestamps: undefined
  }

  delete marshalled.id
  delete marshalled.user_id
  delete marshalled.followee_favorites
  delete marshalled.artwork
  delete marshalled.favorite_count
  delete marshalled.added_timestamps

  return marshalled as UserCollectionMetadata
}

export const makeActivity = (
  activity: APIActivity | APIActivityV2
): UserTrackMetadata | UserCollectionMetadata | undefined => {
  if (isApiActivityV2(activity)) {
    if (!activity.item) {
      return undefined
    }
    if (activity.itemType === 'track') {
      return makeTrack(full.TrackFullToJSON(activity.item as full.TrackFull))
    } else if (activity.itemType === 'playlist') {
      return makePlaylist(
        full.PlaylistFullWithoutTracksToJSON(
          activity.item as full.PlaylistFullWithoutTracks
        )
      )
    }
    return undefined
  } else {
    return activity.item_type === 'track'
      ? makeTrack(activity.item)
      : makePlaylist(activity.item)
  }
}

export const makeStemTrack = (stem: APIStem): StemTrackMetadata | undefined => {
  const [id, parentId, ownerId] = [stem.id, stem.parent_id, stem.user_id].map(
    decodeHashId
  )
  if (!(id && parentId && ownerId)) return undefined

  return {
    blocknumber: stem.blocknumber,
    is_delete: false,
    track_id: id,
    created_at: '',
    isrc: null,
    iswc: null,
    credits_splits: null,
    description: null,
    followee_reposts: [],
    followee_saves: [],
    genre: '',
    has_current_user_reposted: false,
    has_current_user_saved: false,
    license: null,
    mood: null,
    play_count: 0,
    owner_id: ownerId,
    release_date: null,
    repost_count: 0,
    save_count: 0,
    tags: null,
    title: '',
    track_segments: [],
    cover_art: null,
    cover_art_sizes: null,
    cover_art_cids: null,
    is_scheduled_release: false,
    is_unlisted: false,
    stem_of: {
      parent_track_id: parentId,
      category: stem.category
    },
    remix_of: null,
    duration: 0,
    updated_at: '',
    permalink: '',
    is_available: true,
    is_stream_gated: false,
    stream_conditions: null,
    is_download_gated: false,
    download_conditions: null,
    access: { stream: true, download: true },
    track_cid: stem.cid,
    orig_file_cid: '',
    orig_filename: stem.orig_filename,
    is_downloadable: true,
    is_original_available: false,
    is_playlist_upload: false
  }
}

export const adaptSearchResponse = (searchResponse: APIResponse<APISearch>) => {
  return {
    tracks:
      searchResponse.data.tracks?.map(makeTrack).filter(removeNullable) ??
      undefined,
    saved_tracks:
      searchResponse.data.saved_tracks?.map(makeTrack).filter(removeNullable) ??
      undefined,
    users:
      searchResponse.data.users?.map(makeUser).filter(removeNullable) ??
      undefined,
    followed_users:
      searchResponse.data.followed_users
        ?.map(makeUser)
        .filter(removeNullable) ?? undefined,
    playlists:
      searchResponse.data.playlists?.map(makePlaylist).filter(removeNullable) ??
      undefined,
    saved_playlists:
      searchResponse.data.saved_playlists
        ?.map(makePlaylist)
        .filter(removeNullable) ?? undefined,
    albums:
      searchResponse.data.albums?.map(makePlaylist).filter(removeNullable) ??
      undefined,
    saved_albums:
      searchResponse.data.saved_albums
        ?.map(makePlaylist)
        .filter(removeNullable) ?? undefined
  }
}

export const adaptSearchAutocompleteResponse = (
  searchResponse: APIResponse<APISearchAutocomplete>
) => {
  return {
    tracks:
      searchResponse.data.tracks?.map(makeTrack).filter(removeNullable) ??
      undefined,
    saved_tracks:
      searchResponse.data.saved_tracks?.map(makeTrack).filter(removeNullable) ??
      undefined,
    users:
      searchResponse.data.users?.map(makeUser).filter(removeNullable) ??
      undefined,
    followed_users:
      searchResponse.data.followed_users
        ?.map(makeUser)
        .filter(removeNullable) ?? undefined,
    playlists:
      searchResponse.data.playlists?.map(makePlaylist).filter(removeNullable) ??
      undefined,
    saved_playlists:
      searchResponse.data.saved_playlists
        ?.map(makePlaylist)
        .filter(removeNullable) ?? undefined,
    albums:
      searchResponse.data.albums?.map(makePlaylist).filter(removeNullable) ??
      undefined,
    saved_albums:
      searchResponse.data.saved_albums
        ?.map(makePlaylist)
        .filter(removeNullable) ?? undefined
  }
}
