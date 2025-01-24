import { QueryClient } from '@tanstack/react-query'
import { AnyAction, Dispatch } from 'redux'
import { SetRequired } from 'type-fest'

import { Kind } from '~/models'
import { UserCollectionMetadata } from '~/models/Collection'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { QUERY_KEYS } from '../queryKeys'

import { primeTrackDataInternal } from './primeTrackData'
import { primeUserDataInternal } from './primeUserData'

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
  const entries = primeCollectionDataInternal({ collections, queryClient })
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

export const primeCollectionDataInternal = ({
  collections,
  queryClient
}: {
  collections: UserCollectionMetadata[]
  queryClient: QueryClient
}): EntriesByKind => {
  // Set up entries for Redux
  const entries: SetRequired<EntriesByKind, Kind.COLLECTIONS> = {
    [Kind.COLLECTIONS]: {},
    [Kind.TRACKS]: {},
    [Kind.USERS]: {}
  }

  collections.forEach((collection) => {
    // Add collection to entries and prime collection data
    entries[Kind.COLLECTIONS][collection.playlist_id] = collection
    queryClient.setQueryData(
      [QUERY_KEYS.collection, collection.playlist_id],
      collection
    )
    queryClient.setQueryData(
      [QUERY_KEYS.collectionByPermalink, collection.permalink],
      collection
    )

    // Prime user data from collection owner
    if (collection.user) {
      const userEntries = primeUserDataInternal({
        users: [collection.user],
        queryClient
      })

      // Merge user entries
      entries[Kind.USERS] = {
        ...entries[Kind.USERS],
        ...userEntries[Kind.USERS]
      }
    }

    // Prime track and user data from tracks in collection
    if (collection.tracks?.length) {
      const trackEntries = primeTrackDataInternal({
        tracks: collection.tracks,
        queryClient
      })

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
