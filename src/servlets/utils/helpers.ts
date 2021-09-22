import libs from '../../libs'
import {
  DEFAULT_IMAGE_URL,
  ExploreInfoType,
  exploreMap,
  USER_NODE_IPFS_GATEWAY
} from './constants'

export const getTrack = async (id: number): Promise<any> => {
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

export const getTracks = async (ids: number[]): Promise<any> => {
  const ts =  await libs.Track.getTracks(ids.length, 0, ids)
  if (ts) return ts
  throw new Error(`Failed to get tracks ${ids}`)
}

export const getTrackByHandleAndSlug = async (handle: string, slug: string): Promise<any> => {
  const track = await libs.Track.getTracksByHandleAndSlug(handle, slug)
  if (track && track.length > 0) return track[0]

  // Try the old route method, ensuring that the track once found has the same owner handle.
  // Ensure at least 5 digits (anything lower has old route in the DB)
  const matches = slug.match(/[0-9]{5,}$/)
  if (matches) {
    const tracks = await getTracks([parseInt(matches[0])])
    if (tracks && tracks[0] && tracks[0].permalink) {
      const splitted = tracks[0].permalink.split('/')
      const foundHandle = splitted.length > 0 ? splitted[1] : ''
      if (foundHandle.toLowerCase() === handle.toLowerCase()) {
        return tracks[0]
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

export const getUser = async (id: number): Promise<any> => {
  const u = await libs.User.getUsers(1, 0, [id])
  if (u && u[0]) return u[0]
  throw new Error(`Failed to get user ${id}`)
}

export const getUsers = async (ids: number[]): Promise<any> => {
  const us = await libs.User.getUsers(ids.length, 0, ids)
  if (us) return us
  throw new Error(`Failed to get users: ${ids}`)
}

export const getUserByHandle = async (handle: string): Promise<any> => {
  const u = await libs.User.getUsers(1, 0, null, null, handle)
  if (u && u[0]) return u[0]
  throw new Error(`Failed to get user ${handle}`)
}

export const formatGateway = (creatorNodeEndpoint: string, userId: number): string =>
  creatorNodeEndpoint
    ? `${creatorNodeEndpoint.split(',')[0]}/ipfs/`
    : USER_NODE_IPFS_GATEWAY

export const getImageUrl = (cid: string, gateway: string | null): string => {
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
