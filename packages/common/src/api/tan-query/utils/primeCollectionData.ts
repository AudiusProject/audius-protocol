import { omit } from 'lodash'
import { AnyAction, Dispatch } from 'redux'
import { SetRequired } from 'type-fest'

import { Kind } from '~/models'
import { CollectionMetadata, UserCollectionMetadata } from '~/models/Collection'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { TQCollection } from '../models'
import { TypedQueryClient } from '../typed-query-client'
import { getCollectionQueryKey } from '../useCollection'
import { getCollectionByPermalinkQueryKey } from '../useCollectionByPermalink'

import { primeTrackDataInternal } from './primeTrackData'
import { primeUserDataInternal } from './primeUserData'

export const primeCollectionData = ({
  collections,
  queryClient,
  dispatch,
  forceReplace = false,
  skipQueryData = false
}: {
  collections: (UserCollectionMetadata | CollectionMetadata)[]
  queryClient: TypedQueryClient
  dispatch: Dispatch<AnyAction>
  forceReplace?: boolean
  skipQueryData?: boolean
}) => {
  const entries = primeCollectionDataInternal({
    collections,
    queryClient,
    forceReplace,
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
  forceReplace = false,
  skipQueryData = false
}: {
  collections: (UserCollectionMetadata | CollectionMetadata)[]
  queryClient: TypedQueryClient
  forceReplace?: boolean
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
      forceReplace ||
      (!skipQueryData &&
        !queryClient.getQueryData(
          getCollectionQueryKey(collection.playlist_id)
        ))
    ) {
      const tqCollection = {
        ...omit(collection, ['tracks', 'user']),
        trackIds: collection.tracks?.map((t) => t.track_id) ?? []
      } as TQCollection
      queryClient.setQueryData(
        getCollectionQueryKey(collection.playlist_id),
        tqCollection
      )
    }

    if (
      forceReplace ||
      !queryClient.getQueryData(
        getCollectionByPermalinkQueryKey(collection.permalink)
      )
    ) {
      queryClient.setQueryData(
        getCollectionByPermalinkQueryKey(collection.permalink),
        collection.playlist_id
      )
    }

    // Prime user data from collection owner
    if ('user' in collection) {
      const userEntries = primeUserDataInternal({
        users: [collection.user],
        queryClient,
        forceReplace
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
        forceReplace
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
