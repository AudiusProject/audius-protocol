import { useEffect } from 'react'

import { useQuery, useTypedQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'

import { useAudiusQueryContext } from '~/audius-query'
import { Feature, ID } from '~/models'
import { toast } from '~/store/ui/toast/slice'

import { CommentOrReply, messages } from './types'
import { getCommentQueryKey } from './utils'

export const useComment = (commentId: ID) => {
  const { reportToSentry } = useAudiusQueryContext()
  const queryClient = useTypedQueryClient()
  const dispatch = useDispatch()

  const queryRes = useQuery({
    queryKey: getCommentQueryKey(commentId),
    enabled: !!commentId,
    queryFn: async (): Promise<CommentOrReply | {}> => {
      // TODO: there's no backend implementation of this fetch at the moment;
      // but we also never expect to call the backend here; we always prepopulate the data from the fetch by tracks method
      return queryClient.getQueryData(getCommentQueryKey(commentId)) ?? {}
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
