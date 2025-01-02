import type { QueryClient } from '@tanstack/react-query'

import { QUERY_KEYS } from '~/api/tan-query/queryKeys'
import { ID } from '~/models'

import { Kind } from '../../models/Kind'

import type { EntriesByKind, Metadata } from './types'

type EntityUpdater = {
  singleKey: string
  listKey: string
  idField: string
  updateRelations?: (
    queryClient: QueryClient,
    id: number,
    metadata: any
  ) => void
}

const ENTITY_UPDATERS: Record<Kind, EntityUpdater> = {
  [Kind.USERS]: {
    singleKey: QUERY_KEYS.user,
    listKey: QUERY_KEYS.users,
    idField: 'user_id',
    updateRelations: (queryClient, id, metadata) => {
      // Update userByHandle cache
      if (metadata.handle) {
        queryClient.setQueryData(
          [QUERY_KEYS.userByHandle, metadata.handle],
          metadata
        )
      }

      // Update accountUser cache if it matches the user
      queryClient.setQueriesData(
        { queryKey: [QUERY_KEYS.accountUser] },
        (oldData: any) => {
          if (!oldData?.user_id || oldData.user_id !== id) return oldData
          return metadata
        }
      )

      // Update any tracks that might contain this user
      queryClient.setQueriesData(
        { queryKey: [QUERY_KEYS.track] },
        (oldData: any) => {
          if (!oldData?.user || oldData.user.user_id !== id) return oldData
          return {
            ...oldData,
            user: metadata
          }
        }
      )

      // Update any collections that might contain this user
      queryClient.setQueriesData(
        { queryKey: [QUERY_KEYS.collection] },
        (oldData: any) => {
          if (!oldData) return oldData

          let updatedData = oldData

          // Update collection if the user is the owner
          if (oldData.user?.user_id === id) {
            updatedData = {
              ...oldData,
              user: metadata
            }
          }

          // Update collection if the user appears in any of the tracks
          if (
            oldData.tracks?.some((track: any) => track.user?.user_id === id)
          ) {
            updatedData = {
              ...updatedData,
              tracks: oldData.tracks.map((track: any) =>
                track.user?.user_id === id
                  ? {
                      ...track,
                      user: metadata
                    }
                  : track
              )
            }
          }

          return updatedData
        }
      )
    }
  },
  [Kind.TRACKS]: {
    singleKey: QUERY_KEYS.track,
    listKey: QUERY_KEYS.tracks,
    idField: 'track_id',
    updateRelations: (queryClient, id, metadata) => {
      // Update any collections that might contain this track
      queryClient.setQueriesData(
        { queryKey: [QUERY_KEYS.collection] },
        (oldData: any) => {
          if (!oldData?.tracks) return oldData
          return {
            ...oldData,
            tracks: oldData.tracks.map((track: any) =>
              track.track_id === id ? metadata : track
            )
          }
        }
      )
    }
  },
  [Kind.COLLECTIONS]: {
    singleKey: QUERY_KEYS.collection,
    listKey: QUERY_KEYS.collections,
    idField: 'playlist_id',
    updateRelations: (queryClient, id, metadata) => {
      // Update collectionByPermalink cache if we have a permalink
      if (metadata.permalink) {
        queryClient.setQueryData(
          [QUERY_KEYS.collectionByPermalink, metadata.permalink],
          metadata
        )
      }
    }
  },
  [Kind.TRACK_ROUTES]: {
    singleKey: 'track_route',
    listKey: 'track_routes',
    idField: 'id'
  },
  [Kind.EMPTY]: {
    singleKey: 'empty',
    listKey: 'empty',
    idField: 'id'
  }
}

const updateEntity = (
  queryClient: QueryClient,
  kind: Kind,
  id: ID,
  metadata: Metadata
) => {
  const updater = ENTITY_UPDATERS[kind]
  if (!updater) return

  // Update single entity
  queryClient.setQueryData([updater.singleKey, id], metadata)

  // Update entity in lists
  queryClient.setQueriesData(
    { queryKey: [updater.listKey] },
    (oldData: any) => {
      if (!Array.isArray(oldData)) return oldData
      return oldData.map((item) =>
        item[updater.idField] === id ? metadata : item
      )
    }
  )

  // Update related entities
  if (updater.updateRelations) {
    updater.updateRelations(queryClient, id, metadata)
  }
}

export const syncWithReactQuery = (
  queryClient: QueryClient,
  entriesByKind: EntriesByKind
) => {
  Object.entries(entriesByKind).forEach(([kind, entries]) => {
    if (!entries) return
    Object.entries(entries).forEach(([id, entry]) => {
      updateEntity(queryClient, kind as Kind, parseInt(id, 10), entry)
    })
  })
}
