import express from 'express'
import { getTrack, getUser, getCollection, getTracks, getUsers } from '../utils/helpers'
import { getCoverArt, getTrackPath, getCollectionPath } from './helpers'

const DELETED_MESSAGE = 'DELETED'

export enum BedtimeFormat {
  TRACK = 'TRACK',
  COLLECTION = 'COLLECTION'
}

type TrackResponse = {
  title: string
  handle: string
  userName: string
  segments: { duration: number, multihash: string }[]
  urlPath: string
}

type GetTracksResponse = TrackResponse & {
  isVerified: boolean,
  coverArt: string
}

const getTrackMetadata = async (trackId: number): Promise<GetTracksResponse> => {
  try {
    const track = await getTrack(trackId)
    if (track.is_delete) return Promise.reject(DELETED_MESSAGE)

    const user  = await getUser(track.owner_id)
    const coverArt = getCoverArt(track, user)
    const urlPath = getTrackPath({ routeId: track.route_id, trackId: track.track_id })

    return {
      title: track.title,
      handle: user.handle,
      userName: user.name,
      segments: track.track_segments,
      isVerified: user.is_verified,
      coverArt,
      urlPath
    }
  } catch (e) {
    const error = `Failed to get track for ID [${trackId}] with error: [${e.message}]`
    console.error(error)
    return Promise.reject(error)
  }
}

type GetCollectionResponse = {
  name: string
  ownerHandle: string
  ownerName: string
  collectionURLPath: string
  tracks: TrackResponse[]
  coverArt: string
}

const getCollectionMetadata = async (collectionId: number): Promise<GetCollectionResponse> => {
  try {
    const collection = await getCollection(collectionId)
    if (collection.is_delete) return Promise.reject(DELETED_MESSAGE)

    // TODO: Is it possible there are no track_ids?
    const trackIds = collection.playlist_contents.track_ids.map((t: {time: number, track: number }) => t.track)

    // reorder tracks - discprov returns tracks out of order :eyeroll:
    const unordredTracks = await getTracks(trackIds)
    const unorderedTracksMap = unordredTracks.reduce((acc: any, t: any) => ({ ...acc, [t.track_id]: t }), {})
    const tracks = trackIds.map((id: any) => unorderedTracksMap[id])

    // fetch users
    const ownerId = collection.playlist_owner_id
    const userIds = tracks.map((t: any) => t.owner_id)
    const uniqueUserIds = new Set([ownerId, ...userIds])
    const users = await getUsers(Array.from(uniqueUserIds))
    // TODO: types
    const userMap = users.reduce((acc: any, u: any) => ({ ...acc, [u.user_id]: u}), {})
    const ownerUser = userMap[ownerId]

    // Create tracks & filter deletes
    const parsedTracks: TrackResponse[] = tracks.map((t: any) => ({
      title: t.title,
      handle: userMap[t.owner_id].handle,
      userName: userMap[t.owner_id].name,
      segments: t.track_segments,
      urlPath: getTrackPath({ routeId: t.route_id, trackId: t.track_id })
    })).filter((t: any) => !t.is_delete)

    // Create URL path
    const collectionURLPath = getCollectionPath({
      ownerHandle: ownerUser.handle,
      isAlbum: collection.is_album,
      name: collection.playlist_name,
      id: collection.playlist_id
    })

    const coverArt = getCoverArt(collection, ownerUser)

    return {
      name: collection.playlist_name,
      ownerName: ownerUser.name,
      collectionURLPath,
      ownerHandle: ownerUser.handle,
      tracks: parsedTracks,
      coverArt
    }
  } catch (e) {
    const error = `Failed to get collection for ID [${collectionId}] with error: [${e.message}]`
    console.error(error)
    return Promise.reject(error)
  }
}
export const getBedtimeResponse = async (
  format: BedtimeFormat,
  req: express.Request,
  res: express.Response
) => {
  const { id } = req.params
  if (id === undefined) {
    res.status(500).send(`Error: empty ID`)
    return
  }

  const parsedId = parseInt(id)

  try {
    let resp = null
    switch (format) {
      case BedtimeFormat.TRACK:
        console.debug(`Embed track: [${id}]`)
        resp = await getTrackMetadata(parsedId)
        break
      case BedtimeFormat.COLLECTION:
        console.debug(`Embed collection: [${id}]`)
        resp = await getCollectionMetadata(parsedId)
        break
    }
    return res.send(resp)
  } catch (e) {
    if (e.message === DELETED_MESSAGE) {
      res.status(404).send(e)
    } else {
      res.status(500).send(e)
    }
  }
}
