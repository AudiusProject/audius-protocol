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

import { primeRelatedData } from '../utils/primeRelatedData'

import {
  COMMENT_ROOT_PAGE_SIZE,
  CommentOrReply,
  GetCommentsByTrackArgs,
  messages
} from './types'
import { getCommentQueryKey, getTrackCommentListQueryKey } from './utils'

export const useGetCommentsByTrackId = ({
  trackId,
  userId,
  sortMethod,
  pageSize = COMMENT_ROOT_PAGE_SIZE
}: GetCommentsByTrackArgs) => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const isMutating = useIsMutating()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queryRes = useInfiniteQuery({
    enabled: !!trackId && trackId !== 0 && isMutating === 0,
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
    staleTime: Infinity, // Stale time is set to infinity so that we never reload data thats currently shown on screen (because sorting could have changed)
    gcTime: 0 // Cache time is set to 1 so that the data is cleared any time we leave the page viewing it or change sorts
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
