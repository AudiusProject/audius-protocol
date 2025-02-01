import type { QueryClient } from '@tanstack/react-query'

import { QUERY_KEYS } from '~/api/tan-query/queryKeys'
import { batchSetQueriesData } from '~/api/tan-query/utils/batchSetQueriesData'
import type { QueryKeyValue } from '~/api/tan-query/utils/batchSetQueriesData'
import { ID } from '~/models'

import { Kind } from '../../models/Kind'

import type { EntriesByKind, Metadata } from './types'

type EntityUpdater = {
  singleKey: string
  listKey: string
  idField: string
  collectUpdates?: (id: number, metadata: any) => QueryKeyValue[]
}

const ENTITY_UPDATERS: Record<Kind, EntityUpdater> = {
  [Kind.USERS]: {
    singleKey: QUERY_KEYS.user,
    listKey: QUERY_KEYS.users,
    idField: 'user_id',
    collectUpdates: (id, metadata) => {
      const updates: QueryKeyValue[] = []

      // Update userByHandle cache
      if (metadata.handle) {
        updates.push({
          queryKey: [QUERY_KEYS.userByHandle, metadata.handle],
          data: metadata
        })
      }

      // Update accountUser cache if it matches the user
      updates.push({
        queryKey: [QUERY_KEYS.accountUser],
        data: (oldData: any) => {
          if (!oldData?.user_id || oldData.user_id !== id) return oldData
          return metadata
        }
      })

      // Update any tracks that might contain this user
      updates.push({
        queryKey: [QUERY_KEYS.track],
        data: (oldData: any) => {
          if (!oldData?.user || oldData.user.user_id !== id) return oldData
          return {
            ...oldData,
            user: metadata
          }
        }
      })

      // Update any collections that might contain this user
      updates.push({
        queryKey: [QUERY_KEYS.collection],
        data: (oldData: any) => {
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
      })

      return updates
    }
  },
  [Kind.TRACKS]: {
    singleKey: QUERY_KEYS.track,
    listKey: QUERY_KEYS.tracks,
    idField: 'track_id',
    collectUpdates: (id, metadata) => {
      // Update any collections that might contain this track
      return [
        {
          queryKey: [QUERY_KEYS.collection],
          data: (oldData: any) => {
            if (!oldData?.tracks) return oldData
            return {
              ...oldData,
              tracks: oldData.tracks.map((track: any) =>
                track.track_id === id ? metadata : track
              )
            }
          }
        }
      ]
    }
  },
  [Kind.COLLECTIONS]: {
    singleKey: QUERY_KEYS.collection,
    listKey: QUERY_KEYS.collections,
    idField: 'playlist_id',
    collectUpdates: (id, metadata) => {
      const updates: QueryKeyValue[] = []
      // Update collectionByPermalink cache if we have a permalink
      if (metadata.permalink) {
        updates.push({
          queryKey: [QUERY_KEYS.collectionByPermalink, metadata.permalink],
          data: metadata
        })
      }
      return updates
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

const getEntityUpdates = (
  kind: Kind,
  id: ID,
  metadata: Metadata
): QueryKeyValue[] => {
  const updater = ENTITY_UPDATERS[kind]
  if (!updater) return []

  const metadataToSet = 'metadata' in metadata ? metadata.metadata : metadata
  const updates: QueryKeyValue[] = []

  // Update single entity
  updates.push({
    queryKey: [updater.singleKey, id],
    data: metadataToSet
  })

  // Update entity in lists
  updates.push({
    queryKey: [updater.listKey],
    data: (oldData: any) => {
      if (!Array.isArray(oldData)) return oldData
      return oldData.map((item) =>
        item[updater.idField] === id ? metadataToSet : item
      )
    }
  })

  // Collect related entity updates
  if (updater.collectUpdates) {
    updates.push(...updater.collectUpdates(id, metadataToSet))
  }

  return updates
}

export const syncWithReactQuery = (
  queryClient: QueryClient,
  entriesByKind: EntriesByKind
) => {
  const updates: QueryKeyValue[] = []
  Object.entries(entriesByKind).forEach(([kind, entries]) => {
    if (!entries) return
    Object.entries(entries).forEach(([id, entry]) => {
      updates.push(...getEntityUpdates(kind as Kind, parseInt(id, 10), entry))
    })
  })
  batchSetQueriesData(queryClient, updates)
}
