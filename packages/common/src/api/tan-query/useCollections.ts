import { useMemo } from 'react'

import { useQueryClient, UseQueryResult } from '@tanstack/react-query'
import { keyBy } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { ID } from '~/models'
import { CommonState } from '~/store'

import { getCollectionsBatcher } from './batchers/getCollectionsBatcher'
import { TQCollection } from './models'
import { QUERY_KEYS } from './queryKeys'
import { QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { combineQueryResults } from './utils/combineQueryResults'
import { useQueries } from './utils/useQueries'

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
    queries: collectionIds?.map((collectionId) => ({
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
      enabled: options?.enabled !== false && !!collectionId && collectionId > 0
    })),
    combine: combineQueryResults<TQCollection[]>
  }) as UseQueryResult<TQCollection[]> & {
    byId: Record<ID, TQCollection>
  }

  const { data: collections } = queriesResults

  const byId = useMemo(() => keyBy(collections, 'playlist_id'), [collections])

  const isSavedToRedux = useSelector((state: CommonState) =>
    collectionIds?.every(
      (collectionId) => !!state.collections.entries[collectionId]
    )
  )

  queriesResults.data = isSavedToRedux ? collections : undefined
  queriesResults.isPending = queriesResults.isPending || !isSavedToRedux
  queriesResults.isLoading = queriesResults.isLoading || !isSavedToRedux
  queriesResults.byId = byId

  return queriesResults
}
