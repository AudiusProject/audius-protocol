import { CommentMetadata } from '@audius/sdk/dist/sdk/api/comments/CommentsAPI'
import { ThunkDispatch } from '@reduxjs/toolkit'

import { createApi } from '~/audius-query'
import { ID } from '~/models'
import { decodeHashId, encodeHashId } from '~/utils'

type Comment = any

// Helper method to save on some copy-pasta
const optimisticUpdateComment = (
  id: ID,
  updates: (prevState: Comment) => Comment,
  dispatch: ThunkDispatch<any, any, any>
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
      async fetch(
        { parentCommentId, ...commentData }: CommentMetadata,
        { audiusSdk }
      ) {
        const sdk = await audiusSdk()
        let decodedParentCommentId
        if (parentCommentId) {
          decodedParentCommentId = decodeHashId(parentCommentId?.toString())
        }
        const commentsRes = await sdk.comments.postComment({
          ...commentData,
          parentCommentId: decodedParentCommentId
        })
        return commentsRes
      },
      options: { type: 'mutation' },
      async onQuerySuccess(comment, _args, { dispatch }) {
        // TODO: update store with new comment
        optimisticUpdateComment(comment.id, () => comment, dispatch)
      }
    },

    // TODO: should this be optimistic or not?
    deleteCommentById: {
      async fetch({ id, userId }: { id: ID; userId: ID }, { audiusSdk }) {
        const commentData = {
          userId,
          entityId: decodeHashId(id.toString())
        }
        const sdk = await audiusSdk()
        await sdk.comments.deleteComment(commentData)
      },
      options: { type: 'mutation' },
      async onQueryStarted({ id }, { dispatch }) {
        // TODO: How to delete?
        // optimisticUpdateComment(id, (comment) => comment, dispatch)
      }
    },
    // Optimistic mutations
    editCommentById: {
      async fetch(
        {
          id,
          userId,
          newMessage
        }: {
          id: ID
          userId: ID
          newMessage: string
        },
        { audiusSdk }
      ) {
        const commentData = {
          body: newMessage,
          userId,
          entityId: decodeHashId(id.toString()),
          entityType: 'TRACK' // Comments are only on tracks for now; likely expand to collections in the future
        }
        const sdk = await audiusSdk()
        await sdk.comments.editComment(commentData)
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
      async fetch({ id, userId }: { id: ID; userId: ID }) {
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
      async fetch(
        { id, userId, isLiked }: { id: ID; userId: ID; isLiked: boolean },
        { audiusSdk }
      ) {
        const sdk = await audiusSdk()
        // TODO: react comment is not correct in the SDK
        // await sdk.comments.reactComment(
        //   userId,
        //   decodeHashId(id.toString()),
        //   isLiked
        // )
      },
      options: { type: 'mutation' },
      async onQueryStarted({ id, isLiked }, { dispatch }) {
        optimisticUpdateComment(
          id,
          (comment) => ({
            ...comment,
            reactCount: comment.reactCount + isLiked ? 1 : -1
          }),
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
