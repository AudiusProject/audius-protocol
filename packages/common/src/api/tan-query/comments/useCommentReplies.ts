import { useEffect } from 'react'

import { Id } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { replyCommentFromSDK, transformAndCleanList } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { Comment, Feature, ID } from '~/models'
import { toast } from '~/store/ui/toast/slice'

import { QueryOptions } from '../types'
import { useCurrentUserId } from '../useCurrentUserId'
import { primeRelatedData } from '../utils/primeRelatedData'

import { COMMENT_REPLIES_PAGE_SIZE, messages } from './types'
import { useComments } from './useComments'
import { getCommentQueryKey, getCommentRepliesQueryKey } from './utils'

export type GetRepliesArgs = {
  commentId: ID
  pageSize?: number
}

export const useCommentReplies = (
  { commentId, pageSize = COMMENT_REPLIES_PAGE_SIZE }: GetRepliesArgs,
  options?: QueryOptions
) => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const startingLimit = 3 // comments will load in with 3 already so we don't start pagination at 0
  const { data: currentUserId } = useCurrentUserId()

  const queryRes = useInfiniteQuery({
    queryKey: getCommentRepliesQueryKey({ commentId, pageSize }),
    initialPageParam: startingLimit,
    getNextPageParam: (lastPage: ID[], pages) => {
      if (lastPage?.length < pageSize) return undefined
      return (pages.length ?? pageSize) * pageSize + startingLimit
    },
    queryFn: async ({ pageParam }): Promise<ID[]> => {
      const sdk = await audiusSdk()
      const response = await sdk.full.comments.getCommentReplies({
        commentId: Id.parse(commentId),
        userId: currentUserId?.toString(),
        limit: pageSize,
        offset: pageParam
      })

      const replyList = transformAndCleanList(
        response.data,
        replyCommentFromSDK
      )

      primeRelatedData({ related: response.related, queryClient, dispatch })

      // Add the replies to our parent comment replies list
      queryClient.setQueryData(
        getCommentQueryKey(commentId),
        (comment: Comment | undefined) =>
          ({
            ...comment,
            replies: [...(comment?.replies ?? []), ...replyList]
          }) as Comment
      )
      // Put each reply into their individual comment cache
      replyList.forEach((comment) => {
        queryClient.setQueryData(getCommentQueryKey(comment.id), comment)
      })
      // Return just the IDs for the infinite query
      return replyList.map((reply) => reply.id)
    },
    select: (data) => data.pages.flat(),
    ...options
  })

  const { error, data: replyIds } = queryRes

  useEffect(() => {
    if (error) {
      reportToSentry({
        error,
        name: 'Comments',
        feature: Feature.Comments
      })
      dispatch(toast({ content: messages.loadError('replies') }))
    }
  }, [error, dispatch, reportToSentry])

  const { data: replies } = useComments(replyIds)

  return { ...queryRes, data: replies }
}
