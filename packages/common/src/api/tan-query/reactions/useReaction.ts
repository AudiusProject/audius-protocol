import { useMemo } from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useCurrentUserId } from '~/api/tan-query/users/account/useCurrentUserId'
import { useQueryContext } from '~/api/tan-query/utils'

import { getReactionsBatcher } from '../batchers/getReactionsBatcher'
import { SelectableQueryOptions } from '../types'

import { Reaction } from './types'
import { getEntityReactionQueryKey } from './utils'

export const useReaction = <TResult = Reaction>(
  entityId: string | null | undefined,
  options?: SelectableQueryOptions<Reaction, TResult>
) => {
  const { audiusSdk } = useQueryContext()
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { data: currentUserId } = useCurrentUserId()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const select = useMemo(() => options?.select, [])

  return useQuery({
    queryKey: getEntityReactionQueryKey(entityId ?? ''),
    queryFn: async () => {
      const sdk = await audiusSdk()
      const batchGetReactions = getReactionsBatcher({
        sdk,
        queryClient,
        dispatch,
        currentUserId
      })
      return await batchGetReactions.fetch(entityId!)
    },
    ...options,
    select,
    enabled: options?.enabled !== false && !!entityId,
    // Disable refetching since reactions are only updated through mutations
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity
  })
}
