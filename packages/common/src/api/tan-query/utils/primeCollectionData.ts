import { QueryClient } from '@tanstack/react-query'
import { omit } from 'lodash'
import { AnyAction, Dispatch } from 'redux'
import { SetRequired } from 'type-fest'

import { Kind } from '~/models'
import { UserCollectionMetadata } from '~/models/Collection'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { TQCollection } from '../models'
import { getCollectionQueryKey } from '../useCollection'

import { primeTrackDataInternal } from './primeTrackData'
import { primeUserDataInternal } from './primeUserData'

export const primeCollectionData = ({
  collections,
  queryClient,
  dispatch,
  forceReplace = false,
  skipQueryData = false
}: {
  collections: UserCollectionMetadata[]
  queryClient: QueryClient
  dispatch: Dispatch<AnyAction>
  forceReplace?: boolean
  skipQueryData?: boolean
}) => {
  const entries = primeCollectionDataInternal({
    collections,
    queryClient,
    skipQueryData
  })
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
  queryClient,
  skipQueryData = false
}: {
  collections: UserCollectionMetadata[]
  queryClient: QueryClient
  skipQueryData?: boolean
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

    // Prime collection data only if it doesn't exist and skipQueryData is false
    if (
      !skipQueryData &&
      !queryClient.getQueryData(getCollectionQueryKey(collection.playlist_id))
    ) {
      const tqCollection: TQCollection = {
        ...omit(collection, ['tracks', 'user']),
        trackIds: collection.tracks?.map((t) => t.track_id) ?? []
      }
      queryClient.setQueryData(
        getCollectionQueryKey(collection.playlist_id),
        tqCollection
      )
    }

    // Prime user data from collection owner
    if (collection.user) {
      const userEntries = primeUserDataInternal({
        users: [collection.user],
        queryClient,
        skipQueryData
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
        queryClient,
        skipQueryData
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
