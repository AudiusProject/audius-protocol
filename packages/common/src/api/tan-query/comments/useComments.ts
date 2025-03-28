import { useMemo } from 'react'

import { useTypedQueryClient } from '@audius/api'
import { keyBy } from 'lodash'

import { ID } from '~/models/Identifiers'

import { QueryOptions } from '../types'
import { combineQueryResults } from '../utils/combineQueryResults'
import { useQueries } from '../utils/useQueries'

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
  const queryClient = useTypedQueryClient()

  const queryResults = useQueries({
    queries: commentIds?.map((commentId) => ({
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

  const { data: comments } = queryResults

  const byId = useMemo(() => {
    const byId = keyBy(comments, 'id')
    return byId
  }, [comments])

  return {
    data: comments,
    byId,
    commentIds: commentIds ?? [],
    isPending: queryResults.isPending,
    isLoading: queryResults.isLoading
  }
}
