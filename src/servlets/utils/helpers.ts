import libs from '../../libs'
import { FullTrack, Track, TrackModel, TrackSegment } from '../../types/Track'
import { FullUser, UserModel } from '../../types/User'
import {
  DEFAULT_IMAGE_URL,
  ExploreInfoType,
  exploreMap,
  USER_NODE_IPFS_GATEWAY
} from './constants'
import { encodeHashId } from './hashids'

export const getTrack = async (id: number): Promise<TrackModel> => {
  const t = await libs.Track.getTracks(
    /* limit */ 1,
    /* offset */ 0,
    /* idsArray */ [id],
    /* targetUserId */ null,
    /* sort */ null,
    /* minBlockNumber */ null,
    /* filterDeleted */ null,
    /* withUsers */ true
  )
  if (t && t[0]) return t[0]
  throw new Error(`Failed to get track ${id}`)
}

export const getTracks = async (ids: number[]): Promise<TrackModel[]> => {
  const ts =  await libs.Track.getTracks(ids.length, 0, ids)
  if (ts) return ts
  throw new Error(`Failed to get tracks ${ids}`)
}

const userModelToFullUser = (user: UserModel): FullUser => {
  return {
    ...user,
    id: encodeHashId(user.user_id)!,
    cover_photo_legacy: null,
    profile_picture_legacy: null
  }
}

const trackModelToFullTrack = async (track: TrackModel): Promise<FullTrack> => {
  const user: UserModel = await getUser(track.owner_id)
  const gateway = formatGateway(user.creator_node_endpoint, user.user_id)

  const coverArt = track.cover_art_sizes
    ? `${track.cover_art_sizes}/1000x1000.jpg`
    : track.cover_art
  const artwork = {
    ['150x150']: null,
    ['480x480']: null,
    ['1000x1000']: getImageUrl(coverArt, gateway)
  }

  const releaseDate = track.release_date ? track.release_date : track.created_at
  const duration = track.track_segments.reduce(
    (acc: number, v) => acc = acc + v.duration,
    0
  )

  // Map remix_of and stem_of to FullTrack
  const remixOf = track.remix_of
    ? {
      tracks: track.remix_of.tracks.map((t) => ({
        ...t,
        parent_track_id: encodeHashId(t.parent_track_id)!,
        user: userModelToFullUser(user)
      }))
    }
    : null
  const stemOf = { category: null, parent_track_id: null }

  return {
    ...track,
    id: encodeHashId(track.track_id)!,
    user: userModelToFullUser(user),
    artwork,
    release_date: releaseDate,
    duration,
    remix_of: remixOf,
    stem_of: stemOf,
    favorite_count: track.save_count,
    downloadable: track.download.is_downloadable,
    followee_favorites: track.followee_saves,
    user_id: encodeHashId(track.owner_id)!
  }
}

export const getTrackByHandleAndSlug = async (handle: string, slug: string): Promise<Track> => {
  const track = await libs.Track.getTracksByHandleAndSlug(handle, slug)
  if (track) return Array.isArray(track) ? track[0] : track

  // Ensure at least 5 digits (anything lower has old route in the DB)
  const matches = slug.match(/[0-9]{5,}$/)
  if (matches) {
    const tracks = await getTracks([parseInt(matches[0], 10)])
    if (tracks && tracks[0] && tracks[0].permalink) {
      const splitted = tracks[0].permalink.split('/')
      const foundHandle = splitted.length > 0 ? splitted[1] : ''
      if (foundHandle.toLowerCase() === handle.toLowerCase()) {
        return trackModelToFullTrack(tracks[0])
      }
    }
  }
  throw new Error(`Failed to get track ${handle}/${slug}`)
}

export const getCollection = async (id: number): Promise<any> => {
  const c = await libs.Playlist.getPlaylists(
    /* limit */ 1,
    /* offset */ 0,
    /* idsArray */ [id],
    /* targetUserId */ null,
    /* withUsers */ true
  )
  if (c && c[0]) return c[0]
  throw new Error(`Failed to get collection ${id}`)
}

export const getUser = async (id: number): Promise<UserModel> => {
  const u = await libs.User.getUsers(1, 0, [id])
  if (u && u[0]) return u[0]
  throw new Error(`Failed to get user ${id}`)
}

export const getUsers = async (ids: number[]): Promise<UserModel[]> => {
  const us = await libs.User.getUsers(ids.length, 0, ids)
  if (us) return us
  throw new Error(`Failed to get users: ${ids}`)
}

export const getUserByHandle = async (handle: string): Promise<UserModel> => {
  const u = await libs.User.getUsers(1, 0, null, null, handle)
  if (u && u[0]) return u[0]
  throw new Error(`Failed to get user ${handle}`)
}

export const formatGateway = (creatorNodeEndpoint: string, userId: number): string =>
  creatorNodeEndpoint
    ? `${creatorNodeEndpoint.split(',')[0]}/ipfs/`
    : USER_NODE_IPFS_GATEWAY

export const getImageUrl = (cid: string | null, gateway: string | null): string => {
  if (!cid) return DEFAULT_IMAGE_URL
  return `${gateway}${cid}`
}

export const getExploreInfo = (type: string): ExploreInfoType => {
  if (!Object.keys(exploreMap).includes(type)) {
    return {
      title: 'Just For You',
      description: `Content curated for you based on your likes, reposts, and follows.
                    Refreshes often so if you like a track, favorite it.`,
      image: DEFAULT_IMAGE_URL
    }
  }
  return exploreMap[type]
}

/**
 * Fisher-Yates algorithm shuffles an array
 * @param a any array
 */
export const shuffle = (a: any[]) => {
  for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)) as number
      [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Optionally redirect certain tracks to 404
const REDIRECT_TRACK_ID_RANGE = [416972, 418372]
export const shouldRedirectTrack = (trackId: number) =>
  trackId >= REDIRECT_TRACK_ID_RANGE[0] && trackId <= REDIRECT_TRACK_ID_RANGE[1]
