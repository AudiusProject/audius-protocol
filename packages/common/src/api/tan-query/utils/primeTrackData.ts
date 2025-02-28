import { QueryClient } from '@tanstack/react-query'
import { omit } from 'lodash'
import { AnyAction, Dispatch } from 'redux'
import { SetRequired } from 'type-fest'

import { Kind } from '~/models'
import { TrackMetadata, UserTrackMetadata } from '~/models/Track'
import { User } from '~/models/User'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { getTrackQueryKey } from '../useTrack'

import { primeUserDataInternal } from './primeUserData'

export const primeTrackData = ({
  tracks,
  queryClient,
  dispatch,
  forceReplace = false,
  skipQueryData = false
}: {
  tracks: (UserTrackMetadata | TrackMetadata)[]
  queryClient: QueryClient
  dispatch: Dispatch<AnyAction>
  forceReplace?: boolean
  skipQueryData?: boolean
}) => {
  const entries = primeTrackDataInternal({
    tracks,
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
  tracks: (UserTrackMetadata | TrackMetadata)[]
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
