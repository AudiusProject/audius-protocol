import { useEffect } from 'react'

import { Id, OptionalId } from '@audius/sdk'
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

import { useCurrentUserId } from '../useCurrentUserId'
import { primeRelatedData } from '../utils/primeRelatedData'

import { COMMENT_ROOT_PAGE_SIZE, CommentOrReply, messages } from './types'
import { getCommentQueryKey } from './utils'

export const useUserComments = ({
  userId,
  pageSize = COMMENT_ROOT_PAGE_SIZE
}: {
  userId: ID | null
  pageSize?: number
}) => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const { data: currentUserId } = useCurrentUserId()
  const isMutating = useIsMutating()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queryRes = useInfiniteQuery({
    enabled: !!userId && userId !== 0 && isMutating === 0,
    initialPageParam: 0,
    getNextPageParam: (lastPage: ID[], pages) => {
      if (lastPage?.length < pageSize) return undefined
      return (pages.length ?? 0) * pageSize
    },
    queryKey: ['userCommentList', userId, pageSize],
    queryFn: async ({ pageParam }): Promise<ID[]> => {
      const sdk = await audiusSdk()
      const commentsRes = await sdk.full.users.getUserComments({
        id: Id.parse(userId),
        userId: OptionalId.parse(currentUserId),
        offset: pageParam,
        limit: pageSize
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
    }
  })

  const { error } = queryRes

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

  return { ...queryRes, data: queryRes.data?.pages?.flat() ?? [] }
}
