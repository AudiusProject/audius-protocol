import { CommentMetadata } from '@audius/sdk/dist/sdk/api/comments/CommentsAPI'

import { createApi } from '~/audius-query'
import { ID } from '~/models'
import { encodeHashId } from '~/utils'

type Comment = any

// Helper method to save on some copy-pasta
const optimisticUpdateComment = (
  id: ID,
  updates: (state) => any, // TODO: fix types
  dispatch: any // TODO: fix types
) => {
  dispatch(
    commentsApi.util.updateQueryData(
      'getCommentById',
      {
        id
      },
      updates
    )
  )
}

const commentsApi = createApi({
  reducerPath: 'commentsApi',
  endpoints: {
    // Queries
    getCommentsByTrackId: {
      async fetch({ entityId }: { entityId: ID }, { audiusSdk }) {
        const sdk = await audiusSdk()
        const commentsRes = await sdk.tracks.trackComments({
          trackId: encodeHashId(entityId)
        })
        return commentsRes?.data
      },
      options: { type: 'query' },
      async onQuerySuccess(comments, _args, { dispatch }) {
        comments.forEach((comment) => {
          optimisticUpdateComment(comment.id, () => comment, dispatch)
        })
      }
    },
    getCommentById: {
      async fetch({ id }: { id: ID }, { audiusSdk }) {
        const sdk = await audiusSdk()
        const commentsRes = await sdk.comments.getComment({
          id: encodeHashId(id)
        })
        return commentsRes?.data
      },
      options: { type: 'query' }
    },

    // Non-optimistic mutations
    postComment: {
      async fetch(commentData: CommentMetadata, { audiusSdk }) {
        const sdk = await audiusSdk()
        const commentsRes = await sdk.comments.postComment(commentData)
        return commentsRes
      },
      options: { type: 'mutation' },
      async onQuerySuccess(comment, _args, { dispatch }) {
        // TODO: update store with new comment
        optimisticUpdateComment(comment.id, () => comment, dispatch)
      }
    },

    // Optimistic mutations
    // TODO: should this be optimistic?
    deleteCommentById: {
      async fetch({ id }: { id: ID }) {
        // TODO: call sdk here
      },
      options: { type: 'mutation' },
      async onQueryStarted({ id }, { dispatch }) {
        // TODO: How to delete?
        // optimisticUpdateComment(id, (comment) => comment, dispatch)
      }
    },
    editCommentById: {
      async fetch({ id, newMessage }: { id: ID; newMessage: string }) {
        // TODO: call sdk here
      },
      options: { type: 'mutation' },
      async onQueryStarted({ id, newMessage }, { dispatch }) {
        optimisticUpdateComment(
          id,
          (comment) => ({ ...comment, message: newMessage }),
          dispatch
        )
      }
    },
    pinCommentById: {
      async fetch({ id }: { id: ID }) {
        // TODO: call sdk here
      },
      options: { type: 'mutation' },
      async onQueryStarted({ id }, { dispatch }) {
        optimisticUpdateComment(
          id,
          (comment) => ({ ...comment, isPinned: !comment.isPinned }),
          dispatch
        )
      }
    },
    reactToCommentById: {
      async fetch({ id }: { id: ID }) {
        // TODO: call sdk here
      },
      options: { type: 'mutation' },
      async onQueryStarted({ id }, { dispatch }) {
        optimisticUpdateComment(
          id,
          (comment) => ({ ...comment, reactCount: comment.reactCount + 1 }),
          dispatch
        )
      }
    }
  }
})

export const {
  useGetCommentsByTrackId,
  useGetCommentById,
  useEditCommentById,
  useDeleteCommentById,
  usePostComment,
  usePinCommentById,
  useReactToCommentById
} = commentsApi.hooks

export const commentsApiFetch = commentsApi.fetch

export const commentsApiReducer = commentsApi.reducer
