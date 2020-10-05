import Favorite from 'models/Favorite'
import Repost from 'models/Repost'
import { Remix, UserTrackMetadata } from 'models/Track'
import { UserMetadata } from 'models/User'
import { decodeHashId } from 'utils/route/hashIds'
import { removeNullable } from 'utils/typeUtils'
import { APIFavorite, APIRemix, APIRepost, APITrack, APIUser } from './types'

export const makeUser = (user: APIUser): UserMetadata | undefined => {
  const decodedUserId = decodeHashId(user.id)
  if (!decodedUserId) {
    return undefined
  }

  const newUser = {
    ...user,
    user_id: decodedUserId,
    cover_photo: user.cover_photo_sizes || user.cover_photo_legacy,
    profile_picture: user.profile_picture_sizes || user.profile_picture_legacy,
    id: undefined
  }

  delete newUser.id

  return newUser
}

const makeFavorite = (favorite: APIFavorite): Favorite | undefined => {
  const decodedSaveItemId = decodeHashId(favorite.favorite_item_id)
  const decodedUserId = decodeHashId(favorite.user_id)
  if (!decodedSaveItemId || !decodedUserId) {
    return undefined
  }
  return {
    save_item_id: decodedSaveItemId,
    user_id: decodedUserId,
    save_type: favorite.favorite_type
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

export const makeTrack = (track: APITrack): UserTrackMetadata | undefined => {
  const decodedTrackId = decodeHashId(track.id)
  const decodedOwnerId = decodeHashId(track.user_id)
  const user = makeUser(track.user)
  if (!decodedTrackId || !decodedOwnerId || !user) {
    return undefined
  }

  const saves = track.followee_favorites
    .map(makeFavorite)
    .filter(removeNullable)

  const reposts = track.followee_reposts.map(makeRepost).filter(removeNullable)

  const remixes =
    track.remix_of.tracks?.map(makeRemix).filter(removeNullable) ?? []

  const marshalled = {
    ...track,
    user,
    track_id: decodedTrackId,
    owner_id: decodedOwnerId,
    followee_saves: saves,
    followee_reposts: reposts,
    save_count: track.favorite_count,
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
    downloadable: undefined,
    favorite_count: undefined
  }

  delete marshalled.id
  delete marshalled.user_id
  delete marshalled.followee_favorites
  delete marshalled.artwork
  delete marshalled.downloadable
  delete marshalled.favorite_count

  return marshalled
}
