import { useMemo } from 'react'

import { useQueries, useQueryClient } from '@tanstack/react-query'
import { keyBy } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { ID } from '~/models'
import { UserCollectionMetadata } from '~/models/Collection'
import { CommonState } from '~/store'

import { getCollectionsBatcher } from './batchers/getCollectionsBatcher'
import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { combineQueryResults } from './utils/combineQueryResults'

export const getCollectionQueryKey = (collectionId: ID | null | undefined) => [
  QUERY_KEYS.collection,
  collectionId
]

export const useCollections = (
  collectionIds: ID[] | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queriesResults = useQueries({
    queries: (collectionIds ?? []).map((collectionId) => ({
      queryKey: getCollectionQueryKey(collectionId),
      queryFn: async () => {
        const sdk = await audiusSdk()
        const batchGetCollections = getCollectionsBatcher({
          sdk,
          currentUserId,
          queryClient,
          dispatch
        })
        return await batchGetCollections.fetch(collectionId)
      },
      ...options,
      enabled: options?.enabled !== false && !!collectionId
    })),
    combine: combineQueryResults<UserCollectionMetadata[]>
  })

  const { data: collections } = queriesResults

  const byId = useMemo(() => keyBy(collections, 'playlist_id'), [collections])

  const isSavedToRedux = useSelector((state: CommonState) =>
    collectionIds?.every(
      (collectionId) => !!state.collections.entries[collectionId]
    )
  )

  const results = {
    ...queriesResults,
    data: isSavedToRedux ? collections : undefined,
    isPending: queriesResults.isPending || !isSavedToRedux,
    isLoading: queriesResults.isLoading || !isSavedToRedux
  } as typeof queriesResults

  return {
    ...results,
    byId
  }
}
