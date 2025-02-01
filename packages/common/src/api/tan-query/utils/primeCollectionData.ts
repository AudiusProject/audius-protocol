import { QueryClient } from '@tanstack/react-query'
import { AnyAction, Dispatch } from 'redux'
import { SetRequired } from 'type-fest'

import { Kind } from '~/models'
import { UserCollectionMetadata } from '~/models/Collection'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { batchSetQueriesEntries } from './batchSetQueriesEntries'
import { collectTrackEntries } from './primeTrackData'
import { collectUserEntries } from './primeUserData'

export const primeCollectionData = ({
  collections,
  queryClient,
  dispatch,
  forceReplace = false
}: {
  collections: UserCollectionMetadata[]
  queryClient: QueryClient
  dispatch: Dispatch<AnyAction>
  forceReplace?: boolean
}) => {
  const entries = collectCollectionEntries(collections)
  batchSetQueriesEntries({ entries, queryClient })
  if (!forceReplace) {
    dispatch(addEntries(entries, false, undefined, 'react-query'))
  } else {
    dispatch(
      addEntries(
        { [Kind.COLLECTIONS]: entries[Kind.COLLECTIONS] },
        forceReplace,
        undefined,
        'react-query'
      )
    )
    dispatch(
      addEntries(
        { ...entries, [Kind.COLLECTIONS]: {} },
        false,
        undefined,
        'react-query'
      )
    )
  }
}

export const collectCollectionEntries = (
  collections: UserCollectionMetadata[]
): EntriesByKind => {
  // Set up entries for Redux
  const entries: SetRequired<EntriesByKind, Kind.COLLECTIONS> = {
    [Kind.COLLECTIONS]: {},
    [Kind.TRACKS]: {},
    [Kind.USERS]: {}
  }

  collections.forEach((collection) => {
    // Add collection to entries
    entries[Kind.COLLECTIONS][collection.playlist_id] = collection

    // Collect user entries from collection owner
    if (collection.user) {
      const userEntries = collectUserEntries([collection.user])

      // Merge user entries
      entries[Kind.USERS] = {
        ...entries[Kind.USERS],
        ...userEntries[Kind.USERS]
      }
    }

    // Collect track and user entries from tracks in collection
    if (collection.tracks?.length) {
      const trackEntries = collectTrackEntries(collection.tracks)

      // Merge track and user entries
      entries[Kind.TRACKS] = {
        ...entries[Kind.TRACKS],
        ...trackEntries[Kind.TRACKS]
      }
      if (trackEntries[Kind.USERS]) {
        entries[Kind.USERS] = {
          ...entries[Kind.USERS],
          ...trackEntries[Kind.USERS]
        }
      }
    }
  })

  return entries
}
