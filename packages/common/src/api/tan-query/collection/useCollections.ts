import { useMemo } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { keyBy } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { useQueryContext } from '~/api/tan-query/utils/QueryContext'
import { ID } from '~/models'
import { CommonState } from '~/store'

import { getCollectionsBatcher } from '../batchers/getCollectionsBatcher'
import { TQCollection } from '../models'
import { QueryOptions } from '../types'
import { useCurrentUserId } from '../users/account/useCurrentUserId'
import { combineQueryResults } from '../utils/combineQueryResults'
import { useQueries } from '../utils/useQueries'

import { getCollectionQueryKey } from './useCollection'

export const useCollections = (
  collectionIds: ID[] | null | undefined,
  options?: QueryOptions
) => {
  const { audiusSdk } = useQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const uniqueCollectionIds = useMemo(
    () =>
      collectionIds?.filter(
        (id, index, self) => self.indexOf(id) === index && !!id
      ),
    [collectionIds]
  )

  const queriesResults = useQueries({
    queries: uniqueCollectionIds?.map((collectionId) => ({
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
    isSuccess: queriesResults.isSuccess,
    isError: queriesResults.isError
  }
}
