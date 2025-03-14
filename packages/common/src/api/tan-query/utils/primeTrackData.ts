import { QueryClient } from '@tanstack/react-query'
import { omit } from 'lodash'
import { AnyAction, Dispatch } from 'redux'
import { SetRequired } from 'type-fest'

import { Kind } from '~/models'
import { Track, TrackMetadata, UserTrackMetadata } from '~/models/Track'
import { User } from '~/models/User'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { getTrackQueryKey } from '../useTrack'

import { primeUserDataInternal } from './primeUserData'

/**
 * Add the cosigned status to the track
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
        play_count: true,
        remixes: true
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
  // audius-query denormalization expects track.user to contain the id of the owner.
  const withUserIdAsUser = { ...withoutUser, user: t.owner_id }
  const withCosign = setIsCoSigned(withUserIdAsUser)
  const withFieldVisibility = setFieldVisibility(withCosign)

  const withDefaultSaves = setDefaultFolloweeSaves(withFieldVisibility)
  return withDefaultSaves
}

export const primeTrackData = ({
  tracks,
  queryClient,
  dispatch,
  forceReplace = false,
  skipQueryData = false
}: {
  tracks: (UserTrackMetadata | Track)[]
  queryClient: QueryClient
  dispatch: Dispatch<AnyAction>
  forceReplace?: boolean
  skipQueryData?: boolean
}) => {
  const formattedTracks = tracks.map((track) => reformat(track))
  const entries = primeTrackDataInternal({
    tracks: formattedTracks,
    queryClient,
    forceReplace,
    skipQueryData
  })
  if (!forceReplace) {
    dispatch(addEntries(entries, false, undefined, 'react-query'))
  } else {
    dispatch(
      addEntries(
        { [Kind.TRACKS]: entries[Kind.TRACKS] },
        forceReplace,
        undefined,
        'react-query'
      )
    )
    dispatch(
      addEntries(
        { ...entries, [Kind.TRACKS]: {} },
        false,
        undefined,
        'react-query'
      )
    )
  }
}

export const primeTrackDataInternal = ({
  tracks,
  queryClient,
  forceReplace = false,
  skipQueryData = false
}: {
  tracks: (UserTrackMetadata | Track)[]
  queryClient: QueryClient
  forceReplace?: boolean
  skipQueryData?: boolean
}): EntriesByKind => {
  // Set up entries for Redux
  const entries: SetRequired<EntriesByKind, Kind.TRACKS | Kind.USERS> = {
    [Kind.TRACKS]: {},
    [Kind.USERS]: {}
  }

  tracks.forEach((track) => {
    if (!track.track_id) return

    // Add track to entries
    entries[Kind.TRACKS][track.track_id] = track

    // Prime track data only if it doesn't exist and skipQueryData is false
    if (
      forceReplace ||
      (!skipQueryData &&
        !queryClient.getQueryData(getTrackQueryKey(track.track_id)))
    ) {
      const tqTrack: TrackMetadata = {
        ...omit(track, 'user')
      }
      queryClient.setQueryData(getTrackQueryKey(track.track_id), tqTrack)
    }

    // Prime user data from track owner
    if ('user' in track) {
      const user = (track as { user: User }).user
      const userEntries = primeUserDataInternal({
        users: [user],
        queryClient,
        skipQueryData,
        forceReplace
      })

      // Merge user entries
      entries[Kind.USERS] = {
        ...entries[Kind.USERS],
        ...userEntries[Kind.USERS]
      }
    }
  })

  return entries
}
