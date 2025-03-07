import { useEffect, useMemo, useState } from 'react'

import { useQueries, useQueryClient } from '@tanstack/react-query'
import { keyBy } from 'lodash'

import { ID } from '~/models/Identifiers'

import { QueryOptions } from '../types'
import { combineQueryResults } from '../utils/combineQueryResults'

import { CommentOrReply } from './types'
import { getCommentQueryKey } from './utils'

export const getCommentsQueryKey = (commentIds: ID[] | null | undefined) => [
  'comments',
  commentIds
]

export const useComments = (
  commentIds: ID[] | null | undefined,
  options?: QueryOptions
) => {
  const queryClient = useQueryClient()
  const [hasInitialized, setHasInitialized] = useState(false)

  const queryResults = useQueries({
    queries: (commentIds ?? []).map((commentId) => ({
      queryKey: getCommentQueryKey(commentId),
      queryFn: async (): Promise<CommentOrReply | {}> => {
        // Comments are expected to be pre-populated in the cache from other queries
        return queryClient.getQueryData(getCommentQueryKey(commentId)) ?? {}
      },
      ...options,
      enabled: options?.enabled !== false && !!commentId
    })),
    combine: combineQueryResults<CommentOrReply[]>
  })

  useEffect(() => {
    if (commentIds?.length) {
      setHasInitialized(true)
    }
  }, [commentIds?.length])

  const { data: comments } = queryResults

  const isPending =
    !hasInitialized || commentIds?.length === 0 || queryResults.isPending

  const isLoading =
    !hasInitialized || commentIds?.length === 0 || queryResults.isLoading

  const byId = useMemo(() => {
    const byId = keyBy(comments, 'id')
    return byId
  }, [comments])

  const results = {
    ...queryResults,
    isPending,
    isLoading
  } as typeof queryResults

  return {
    byId,
    ...results
  }
}
