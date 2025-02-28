import { useEffect } from 'react'

import { Id } from '@audius/sdk'
import {
  useInfiniteQuery,
  useIsMutating,
  useQueryClient
} from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { commentFromSDK, transformAndCleanList } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { Feature, ID } from '~/models'
import { toast } from '~/store/ui/toast/slice'

import { QueryOptions } from '../types'
import { primeRelatedData } from '../utils/primeRelatedData'

import { COMMENT_ROOT_PAGE_SIZE, CommentOrReply, messages } from './types'
import { useComments } from './useComments'
import { getCommentQueryKey, getTrackCommentListQueryKey } from './utils'

export type GetCommentsByTrackArgs = {
  trackId: ID
  userId: ID | null
  sortMethod: any
  pageSize?: number
}

export const useTrackComments = (
  {
    trackId,
    userId,
    sortMethod,
    pageSize = COMMENT_ROOT_PAGE_SIZE
  }: GetCommentsByTrackArgs,
  options?: QueryOptions
) => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const isMutating = useIsMutating()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queryRes = useInfiniteQuery({
    initialPageParam: 0,
    getNextPageParam: (lastPage: ID[], pages) => {
      if (lastPage?.length < pageSize) return undefined
      return (pages.length ?? 0) * pageSize
    },
    queryKey: getTrackCommentListQueryKey({ trackId, sortMethod, pageSize }),
    queryFn: async ({ pageParam }): Promise<ID[]> => {
      const sdk = await audiusSdk()
      const commentsRes = await sdk.full.tracks.getTrackComments({
        trackId: Id.parse(trackId),
        offset: pageParam,
        limit: pageSize,
        sortMethod,
        // TODO: why is this toString instead of encode
        userId: userId?.toString() ?? undefined
      })

      const commentList = transformAndCleanList(
        commentsRes.data,
        commentFromSDK
      )

      primeRelatedData({ related: commentsRes.related, queryClient, dispatch })

      // Populate individual comment cache
      commentList.forEach((comment) => {
        queryClient.setQueryData<CommentOrReply>(
          getCommentQueryKey(comment.id),
          comment
        )
        comment?.replies?.forEach?.((reply) =>
          queryClient.setQueryData<CommentOrReply>(
            getCommentQueryKey(reply.id),
            reply
          )
        )
      })
      // For the comment list cache, we only store the ids of the comments (organized by sort method)
      return commentList.map((comment) => comment.id)
    },
    select: (data) => data.pages.flat(),
    ...options,
    enabled: isMutating === 0 && options?.enabled !== false
  })

  const { error, data: commentIds } = queryRes

  useEffect(() => {
    if (error) {
      reportToSentry({
        error,
        name: 'Comments',
        feature: Feature.Comments
      })
      dispatch(toast({ content: messages.loadError('comments') }))
    }
  }, [error, dispatch, reportToSentry])

  const { data: comments } = useComments(commentIds)

  return { ...queryRes, data: comments }
}
