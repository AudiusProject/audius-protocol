import { QueryClient } from '@tanstack/react-query'
import { AnyAction, Dispatch } from 'redux'

import { Kind } from '~/models'
import { UserTrackMetadata } from '~/models/Track'
import { User } from '~/models/User'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { batchSetQueriesEntries } from './batchSetQueriesEntries'

export const primeTrackData = ({
  tracks,
  queryClient,
  dispatch,
  forceReplace = false
}: {
  tracks: UserTrackMetadata[]
  queryClient: QueryClient
  dispatch: Dispatch<AnyAction>
  forceReplace?: boolean
}) => {
  const entries = collectTrackEntries(tracks)
  batchSetQueriesEntries({ entries, queryClient })
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

export const collectTrackEntries = (
  tracks: UserTrackMetadata[]
): EntriesByKind => {
  const entries: EntriesByKind = {
    [Kind.TRACKS]: Object.fromEntries(
      tracks
        .filter((track) => track.track_id)
        .map((track) => [track.track_id, track])
    ),
    [Kind.USERS]: Object.fromEntries(
      tracks
        .filter(
          (track): track is UserTrackMetadata & { user: User } =>
            'user' in track
        )
        .map((track) => [track.user.user_id, track.user])
    )
  }

  return entries
}
