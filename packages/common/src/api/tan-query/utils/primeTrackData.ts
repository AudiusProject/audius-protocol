import { QueryClient } from '@tanstack/react-query'
import { AnyAction, Dispatch } from 'redux'

import { Kind } from '~/models'
import { Track } from '~/models/Track'
import { User } from '~/models/User'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { QUERY_KEYS } from '../queryKeys'

import { primeUserDataInternal } from './primeUserData'

export const primeTrackData = ({
  track,
  queryClient,
  dispatch
}: {
  track: Track
  queryClient: QueryClient
  dispatch: Dispatch<AnyAction>
}) => {
  const entries = primeTrackDataInternal({ track, queryClient })

  dispatch(addEntries(entries, undefined, undefined, 'react-query'))
}

export const primeTrackDataInternal = ({
  track,
  queryClient
}: {
  track: Track
  queryClient: QueryClient
}): EntriesByKind => {
  // Set up entries for Redux
  const entries: EntriesByKind = {
    [Kind.TRACKS]: {
      [track.track_id]: track
    }
  }

  // Prime track data
  queryClient.setQueryData([QUERY_KEYS.track, track.track_id], track)

  // Prime user data from track owner
  if ('user' in track) {
    const user = (track as { user: User }).user
    const userEntries = primeUserDataInternal({
      user,
      queryClient
    })

    entries[Kind.USERS] = userEntries[Kind.USERS]
  }

  return entries
}
