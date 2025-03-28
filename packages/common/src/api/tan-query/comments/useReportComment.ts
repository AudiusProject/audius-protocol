import {
  InfiniteData,
  useMutation,
  useTypedQueryClient
} from '@tanstack/react-query'
import { cloneDeep } from 'lodash'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { Comment, Feature, ID, ReplyComment } from '~/models'
import { toast } from '~/store/ui/toast/slice'

import { messages } from './types'
import {
  getCommentQueryKey,
  getTrackCommentListQueryKey,
  subtractCommentCount
} from './utils'

export type ReportCommentArgs = {
  commentId: ID
  parentCommentId?: ID
  userId: ID
  trackId: ID
  currentSort: any
}

export const useReportComment = () => {
  const { audiusSdk, reportToSentry } = useAudiusQueryContext()
  const queryClient = useTypedQueryClient()
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: async ({ userId, commentId }: ReportCommentArgs) => {
      const sdk = await audiusSdk()
      await sdk.comments.reportComment(userId, commentId)
    },
    onMutate: ({ trackId, commentId, currentSort, parentCommentId }) => {
      // Optimistic update - filter out the comment from either the top list or the parent comment's replies
      if (parentCommentId) {
        queryClient.setQueryData<Comment>(
          getCommentQueryKey(parentCommentId),
          (prevData: Comment | undefined) => {
            if (!prevData) return
            return {
              ...prevData,
              replies: prevData.replies?.filter(
                (reply: ReplyComment) => reply.id !== commentId
              ),
              replyCount: prevData.replyCount ? prevData.replyCount - 1 : 0
            } as Comment
          }
        )
      } else {
        queryClient.setQueryData<InfiniteData<ID[]>>(
          getTrackCommentListQueryKey({
            trackId,
            sortMethod: currentSort
          }),
          (prevData) => {
            if (!prevData) return
            const newState = cloneDeep(prevData)
            // Filter out our reported comment
            newState.pages = newState.pages.map((page) =>
              page.filter((id) => id !== commentId)
            )
            return newState
          }
        )
      }

      queryClient.resetQueries({
        queryKey: getCommentQueryKey(commentId)
      })
      // Decrease the track comment count
      subtractCommentCount(dispatch, queryClient, trackId)
    },
    onError: (error: Error, args) => {
      const { trackId, currentSort } = args
      reportToSentry({
        error,
        additionalInfo: args,
        name: 'Comments',
        feature: Feature.Comments
      })
      // Generic toast error
      dispatch(toast({ content: messages.mutationError('reporting') }))

      // Reload data
      queryClient.resetQueries({
        queryKey: getTrackCommentListQueryKey({
          trackId,
          sortMethod: currentSort
        })
      })
    }
  })
}
