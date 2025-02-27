import { useEffect } from 'react'

import { Id } from '@audius/sdk'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { replyCommentFromSDK, transformAndCleanList } from '~/adapters'
import { useAudiusQueryContext } from '~/audius-query'
import { Comment, Feature, ReplyComment } from '~/models'
import { toast } from '~/store/ui/toast/slice'

import { useCurrentUserId } from '../useCurrentUserId'
import { primeRelatedData } from '../utils/primeRelatedData'

import { COMMENT_REPLIES_PAGE_SIZE, GetRepliesArgs, messages } from './types'
import { getCommentQueryKey, getCommentRepliesQueryKey } from './utils'

export const useCommentReplies = ({
  commentId,
  enabled,
  pageSize = COMMENT_REPLIES_PAGE_SIZE
}: GetRepliesArgs) => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const startingLimit = 3 // comments will load in with 3 already so we don't start pagination at 0
  const { data: currentUserId } = useCurrentUserId()

  const queryRes = useInfiniteQuery({
    queryKey: getCommentRepliesQueryKey({ commentId, pageSize }),
    enabled: !!enabled,
    initialPageParam: startingLimit,
    getNextPageParam: (lastPage: ReplyComment[], pages) => {
      if (lastPage?.length < pageSize) return undefined
      return (pages.length ?? pageSize) * pageSize + startingLimit
    },
    queryFn: async ({ pageParam }): Promise<ReplyComment[]> => {
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
      return replyList
    },
    staleTime: Infinity,
    gcTime: 1
  })

  const { error } = queryRes

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

  return { ...queryRes, data: queryRes.data?.pages?.flat() ?? [] }
}
