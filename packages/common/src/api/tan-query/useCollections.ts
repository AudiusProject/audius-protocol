import { useMemo } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { keyBy, uniq } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query/AudiusQueryContext'
import { ID } from '~/models'
import { CommonState } from '~/store'

import { getCollectionsBatcher } from './batchers/getCollectionsBatcher'
import { TQCollection } from './models'
import { QUERY_KEYS } from './queryKeys'
import { QueryKey, QueryOptions } from './types'
import { useCurrentUserId } from './useCurrentUserId'
import { combineQueryResults } from './utils/combineQueryResults'
import { useQueries } from './utils/useQueries'

export const getCollectionQueryKey = (collectionId: ID | null | undefined) => {
  return [
    QUERY_KEYS.collection,
    collectionId
  ] as unknown as QueryKey<TQCollection>
}

export const useCollections = (
  collectionIds: ID[] | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const dedupedCollectionIds = useMemo(
    () => (collectionIds ? uniq(collectionIds) : collectionIds),
    [collectionIds]
  )

  const queriesResults = useQueries({
    queries: dedupedCollectionIds?.map((collectionId) => ({
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
  })

  const { data: collections } = queriesResults

  const byId = useMemo(() => keyBy(collections, 'playlist_id'), [collections])

  const isSavedToRedux = useSelector((state: CommonState) =>
    collectionIds?.every(
      (collectionId) => !!state.collections.entries[collectionId]
    )
  )

  return {
    data: isSavedToRedux ? collections : undefined,
    byId,
    status: isSavedToRedux ? queriesResults.status : 'pending',
    isPending: queriesResults.isPending || !isSavedToRedux,
    isLoading: queriesResults.isLoading || !isSavedToRedux,
    isFetching: queriesResults.isFetching,
    isSuccess: queriesResults.isSuccess
  }
}
