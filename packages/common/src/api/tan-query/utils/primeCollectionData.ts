import { QueryClient } from '@tanstack/react-query'
import { AnyAction, Dispatch } from 'redux'

import { Kind } from '~/models'
import { UserCollectionMetadata } from '~/models/Collection'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { primeTrackDataInternal } from './primeTrackData'
import { primeUserDataInternal } from './primeUserData'

export const primeCollectionData = ({
  collection,
  queryClient,
  dispatch
}: {
  collection: UserCollectionMetadata
  queryClient: QueryClient
  dispatch: Dispatch<AnyAction>
}) => {
  const entries = primeCollectionDataInternal({ collection, queryClient })

  dispatch(addEntries(entries, undefined, undefined, 'react-query'))
}

export const primeCollectionDataInternal = ({
  collection,
  queryClient
}: {
  collection: UserCollectionMetadata
  queryClient: QueryClient
}): EntriesByKind => {
  // Set up entries for Redux
  const entries: EntriesByKind = {
    [Kind.COLLECTIONS]: {
      [collection.playlist_id]: collection
    },
    [Kind.TRACKS]: {},
    [Kind.USERS]: {}
  }

  // Prime user data from collection owner
  if (collection.user) {
    const userEntries = primeUserDataInternal({
      users: [collection.user],
      queryClient
    })

    // Merge user entries
    entries[Kind.USERS] = userEntries[Kind.USERS]
  }

  // Track and user data from tracks in collection
  collection.tracks?.forEach((track) => {
    if (track.track_id) {
      // Use primeTrackData to handle track and its user data
      const trackEntries = primeTrackDataInternal({
        track,
        queryClient
      })

      // Set track entry
      entries[Kind.TRACKS] = {
        ...entries[Kind.TRACKS],
        ...trackEntries[Kind.TRACKS]
      }

      // Merge user entries
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
