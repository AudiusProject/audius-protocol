import { QueryClient } from '@tanstack/react-query'
import { Dispatch } from 'redux'

import { UserCollectionMetadata } from '~/models/Collection'
import { Kind } from '~/models/Kind'
import { addEntries } from '~/store/cache/actions'
import { EntriesByKind } from '~/store/cache/types'

import { QUERY_KEYS } from '../queryKeys'

/**
 * Primes the React Query cache and Redux store with collection-related entities (users, tracks)
 */
export const primeCollectionData = ({
  collection,
  queryClient,
  dispatch
}: {
  collection: UserCollectionMetadata
  queryClient: QueryClient
  dispatch: Dispatch
}) => {
  // Prime user data from collection owner
  if (collection.user) {
    // Prime user by ID
    queryClient.setQueryData(
      [QUERY_KEYS.user, collection.user.user_id],
      collection.user
    )
    // Prime user by handle
    if (collection.user.handle) {
      queryClient.setQueryData(
        [QUERY_KEYS.userByHandle, collection.user.handle],
        collection.user
      )
    }
  }

  // Set up entries for Redux
  const entries: EntriesByKind = {
    [Kind.COLLECTIONS]: {
      [collection.playlist_id]: collection
    }
  }

  if (collection.user) {
    if (!entries[Kind.USERS]) entries[Kind.USERS] = {}
    entries[Kind.USERS][collection.user.user_id] = collection.user
  }

  // Track and user data from tracks in collection
  collection.tracks?.forEach((track) => {
    if (track.track_id) {
      // Prime track data
      queryClient.setQueryData([QUERY_KEYS.track, track.track_id], track)
      if (!entries[Kind.TRACKS]) entries[Kind.TRACKS] = {}
      entries[Kind.TRACKS][track.track_id] = track

      // Prime user data from track owner
      if (track.user) {
        // Prime user by ID
        queryClient.setQueryData(
          [QUERY_KEYS.user, track.user.user_id],
          track.user
        )
        // Prime user by handle
        if (track.user.handle) {
          queryClient.setQueryData(
            [QUERY_KEYS.userByHandle, track.user.handle],
            track.user
          )
        }
        if (!entries[Kind.USERS]) entries[Kind.USERS] = {}
        entries[Kind.USERS][track.user.user_id] = track.user
      }
    }
  })

  // Sync all data to Redux in a single dispatch
  dispatch(addEntries(entries, undefined, undefined, 'react-query'))
}
