import express from 'express'
import { getTrack, getUser, getCollection, getTracks, getUsers } from '../utils/helpers'
import { getCoverArt, getTrackPath, getCollectionPath } from './helpers'
import { BedtimeFormat, TrackResponse, GetTracksResponse, GetCollectionResponse } from './types'

// Error Messages
const DELETED_MESSAGE = 'DELETED'

const getTrackMetadata = async (trackId: number, ownerId: number): Promise<GetTracksResponse> => {
  try {
    const track = await getTrack(trackId)
    if (track.is_delete) return Promise.reject(DELETED_MESSAGE)

    const user  = await getUser(ownerId)
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

// TODO: add collection type
const getTracksFromCollection = async (collection: any, ownerUser: any): Promise<TrackResponse[]> => {

  const trackIds: number[] = collection.playlist_contents.track_ids.map((t: {time: number, track: number }) => t.track)
  let tracks = []

  // Fetch tracks if there are IDs
  if (trackIds.length) {
    const unordredTracks = await getTracks(trackIds)

    // reorder tracks - discprov returns tracks out of order
    const unorderedTracksMap = unordredTracks.reduce((acc: any, t: any) => ({ ...acc, [t.track_id]: t }), {})
    tracks = trackIds.map((id: number) => unorderedTracksMap[id])
  }

  // fetch users from tracks
  // only fetch unique IDs that aren't the owner user
  const trackOwnerIds = tracks.map((t: any) => t.owner_id)
  const idsToFetch = new Set(trackOwnerIds.filter((userId: number) => userId !== ownerUser.user_id))
  const users = await getUsers(Array.from(idsToFetch))

  // make a map of all users, including the owner
  const userMap = users.reduce((acc: any, u: any) => ({ ...acc, [u.user_id]: u}), { [ownerUser.userId]: ownerUser })

  // Create tracks and filter out deletes
  const parsedTracks: TrackResponse[] = tracks.map((t: any) => ({
    title: t.title,
    handle: userMap[t.owner_id].handle,
    userName: userMap[t.owner_id].name,
    segments: t.track_segments,
    urlPath: getTrackPath({ routeId: t.route_id, trackId: t.track_id })
  })).filter((t: any) => !t.is_delete)

  return parsedTracks
}


// TODO: add comment explaining the parlalliezation logic here
const getCollectionMetadata = async (collectionId: number, ownerId: number): Promise<GetCollectionResponse> => {
  try {
    const [collection, ownerUser] = await Promise.all([getCollection(collectionId), getUser(ownerId)])

    if (collection.playlist_owner_id !== ownerUser.user_id) return Promise.reject('OwnerIds do not match')
    if (collection.is_delete) return Promise.reject(DELETED_MESSAGE)

    // Get tracks & covert art in parallel
    const [tracks, coverArt] = await Promise.all([getTracksFromCollection(collection, ownerUser), getCoverArt(collection, ownerUser)])

    // Create URL path
    const collectionURLPath = getCollectionPath({
      ownerHandle: ownerUser.handle,
      isAlbum: collection.is_album,
      name: collection.playlist_name,
      id: collection.playlist_id
    })

    return {
      name: collection.playlist_name,
      ownerName: ownerUser.name,
      collectionURLPath,
      ownerHandle: ownerUser.handle,
      tracks,
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

  const { ownerId } = req.query
  if (ownerId === undefined) {
    res.status(500).send(`Error: empty OwnerID`)
    return
  }

  try {
    const [parsedId, parsedOwnerId] = [parseInt(id), parseInt(ownerId)]
    let resp = null
    switch (format) {
      case BedtimeFormat.TRACK:
        console.debug(`Embed track: [${id}]`)
        resp = await getTrackMetadata(parsedId, parsedOwnerId)
        break
      case BedtimeFormat.COLLECTION:
        console.debug(`Embed collection: [${id}]`)
        resp = await getCollectionMetadata(parsedId, parsedOwnerId)
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
