import { useMemo } from 'react'

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

  const { data: comments, ...queryResults } = useQueries({
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

  const byId = useMemo(() => {
    const byId = keyBy(comments, 'id')
    return byId
  }, [comments])

  return {
    data: comments,
    byId,
    ...queryResults
  }
}
