import { CoverArtSizes, Track, TrackMetadata } from '@audius/common'
import { omit } from 'lodash'

import { audiusBackendInstance } from 'services/audius-backend/audius-backend-instance'

/**
 * Adds _cover_art_sizes to a track object if it does not have one set
 */
const addTrackImages = (
  track: TrackMetadata
): TrackMetadata & { duration: number; _cover_art_sizes: CoverArtSizes } => {
  return audiusBackendInstance.getTrackImages(track)
}

/**
 * Potentially add
 * @param track
 */
const setIsCoSigned = <T extends TrackMetadata>(track: T) => {
  const { remix_of } = track

  const remixOfTrack = remix_of?.tracks?.[0]

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
 * When a track is not unlisted, even if field visibility is set
 * we should coerce the track into a state where socials are visible.
 * @param track
 * @returns track with repaired field visibility
 */
const setFieldVisibility = <T extends TrackMetadata>(track: T) => {
  const { is_unlisted } = track
  if (!is_unlisted) {
    // Public track
    return {
      ...track,
      field_visibility: {
        ...track.field_visibility,
        genre: true,
        mood: true,
        tags: true,
        share: true,
        play_count: true
      }
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
const setDefaultFolloweeSaves = <T extends TrackMetadata>(track: T) => {
  return {
    ...track,
    followee_saves: track?.followee_saves ?? []
  }
}

/**
 * Reformats a track to be used internally within the client
 * This method should *always* be called before a track is cached.
 */
export const reformat = <T extends TrackMetadata>(track: T): Track => {
  const t = track
  const withoutUser = omit(t, 'user')
  const withImages = addTrackImages(withoutUser)
  const withCosign = setIsCoSigned(withImages)
  const withFieldVisibility = setFieldVisibility(withCosign)

  const withDefaultSaves = setDefaultFolloweeSaves(withFieldVisibility)
  return withDefaultSaves
}
