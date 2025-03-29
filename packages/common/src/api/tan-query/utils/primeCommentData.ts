import { ReplyComment } from '~/models'

import { CommentOrReply } from '../comments/types'
import { getCommentQueryKey } from '../comments/utils'
import { TypedQueryClient } from '../typed-query-client'
/**
 * Primes the comment data in the query cache
 */
export const primeCommentData = ({
  comments,
  queryClient
}: {
  comments: CommentOrReply[]
  queryClient: TypedQueryClient
}) => {
  // Populate individual comment cache
  comments.forEach((comment) => {
    // Prime the main comment
    queryClient.setQueryData<CommentOrReply>(
      getCommentQueryKey(comment.id),
      comment
    )

    // Prime any replies if they exist
    if ('replies' in comment && comment.replies) {
      comment.replies.forEach((reply: ReplyComment) =>
        queryClient.setQueryData(getCommentQueryKey(reply.id), reply)
      )
    }
  })
}
