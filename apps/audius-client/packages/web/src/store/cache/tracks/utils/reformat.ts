import { omit } from 'lodash'

import AudiusBackend from 'services/AudiusBackend'
import Track from 'models/Track'

/**
 * Adds cover_art_url to a track object if it does not have one set
 */
const addTrackImages = (track: Track) => {
  if (track.cover_art_url) return track
  return AudiusBackend.getTrackImages(track)
}

/**
 * Potentially add
 * @param track
 */
const setIsCoSigned = (track: Track) => {
  const { remix_of } = track

  const remixOfTrack = remix_of?.tracks[0]

  const isCoSigned =
    remixOfTrack &&
    (remixOfTrack.has_remix_author_saved ||
      remixOfTrack.has_remix_author_reposted)

  if (isCoSigned) {
    return {
      ...track,
      _co_sign: remix_of!.tracks[0]
    }
  }
  return track
}

/**
 * NOTE: This is a temporary fix for a backend bug: The field followee_saves is not defined.
 * This is a stopgap to prevent the client from erroring and should be removed after fixed.
 * The current erroneous disprov endpoint is `/feed/reposts/<userid>`
 * @param track
 */
const setDefaultFolloweeSaves = (track: Track) => {
  return {
    ...track,
    followee_saves: track?.followee_saves ?? []
  }
}

/**
 * Reformats a track to be used internally within the client
 * This method should *always* be called before a track is cached.
 */
export const reformat = (track: Track) => {
  let t = track
  t = omit(t, 'user')
  t = addTrackImages(t)
  t = setIsCoSigned(t)
  t = setDefaultFolloweeSaves(t)
  return t
}
