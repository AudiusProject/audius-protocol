import express from 'express'
import { getTrack, getUser, formatGateway, getImageUrl } from '../utils/helpers'


type GetTracksResponse = {
  title: string,
  handle: string,
  userName: string,
  segments: { duration: number, multihas: string }[],
  isVerified: boolean,
  imageURL: string
}

// TODO: add the returntype in here
const getTrackMetadata = async (trackId: number) => {
  // TODO: What if there is no track metadata/ID?

  try {
    const track = await getTrack(trackId)
    const user  = await getUser(track.owner_id)
    const gateway = formatGateway(user.creator_node_endpoint, user.user_id)

    const coverArt = track.cover_art_sizes
      ? `${track.cover_art_sizes}/480x480.jpg`
      : track.cover_art

    return {
      title: track.title,
      handle: user.handle,
      userName: user.name,
      segments: track.track_segments,
      isVerified: user.is_verified,
      imageURL: getImageUrl(coverArt, gateway)
    }
  } catch (e) {
    // TODO
    console.error(`Failed to get track for [${trackId}] with error: [${e.message}]`)
    return {}
  }
}

export enum BedtimeFormat {
  TRACK = 'TRACK',
  COLLECTION = 'COLLECTION'
}

export const getBedtimeResponse = async (
  format: BedtimeFormat,
  req: express.Request,
  res: express.Response
) => {
  // TODO: no ID?

  const id = parseInt(req.params.id)
  let resp = null

  switch (format) {
    case BedtimeFormat.TRACK:
      console.log(`Embed track: [${id}]`)
      resp = await getTrackMetadata(id)
    case BedtimeFormat.COLLECTION:
      // TODO
    default: 
      // TODO
  }
  return res.send(resp)
}

