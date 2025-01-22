import { QueryClient } from '@tanstack/react-query'
import { AnyAction, Dispatch } from 'redux'
import { SetRequired } from 'type-fest'

import { Kind } from '~/models'
import { Track } from '~/models/Track'
import { User } from '~/models/User'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { QUERY_KEYS } from '../queryKeys'

import { primeUserDataInternal } from './primeUserData'

export const primeTrackData = ({
  tracks,
  queryClient,
  dispatch,
  forceReplace = false
}: {
  tracks: Track[]
  queryClient: QueryClient
  dispatch: Dispatch<AnyAction>
  forceReplace?: boolean
}) => {
  const entries = primeTrackDataInternal({ tracks, queryClient })
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
  queryClient
}: {
  tracks: Track[]
  queryClient: QueryClient
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

    // Prime track data
    queryClient.setQueryData([QUERY_KEYS.track, track.track_id], track)

    // Prime user data from track owner
    if ('user' in track) {
      const user = (track as { user: User }).user
      const userEntries = primeUserDataInternal({
        users: [user],
        queryClient
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
