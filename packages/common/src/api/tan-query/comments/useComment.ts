import { useEffect } from 'react'

import { Id } from '@audius/sdk'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { commentFromSDK } from '~/adapters'
import { useQueryContext } from '~/api/tan-query/utils'
import { Feature, ID } from '~/models'
import { toast } from '~/store/ui/toast/slice'

import { CommentOrReply, messages } from './types'
import { getCommentQueryKey } from './utils'

export const useComment = (commentId: ID) => {
  const { audiusSdk, reportToSentry } = useQueryContext()
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const queryRes = useQuery({
    queryKey: getCommentQueryKey(commentId),
    enabled: !!commentId,
    queryFn: async (): Promise<CommentOrReply | {}> => {
      const sdk = await audiusSdk()
      const { data: commentRes } = await sdk.full.comments.getComment({
        commentId: Id.parse(commentId)
      })
      const comment = Array.isArray(commentRes) ? commentRes[0] : commentRes

      if (!comment) return {}

      const marshalledComment = commentFromSDK(comment)
      queryClient.setQueryData(getCommentQueryKey(commentId), marshalledComment)

      return marshalledComment ?? {}
    },
    staleTime: Infinity
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

  return queryRes
}
