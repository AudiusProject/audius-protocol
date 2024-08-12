import { EntityType, Comment } from '@audius/sdk'
import { CommentMetadata } from '@audius/sdk/dist/sdk/api/comments/CommentsAPI'
import { ThunkDispatch } from '@reduxjs/toolkit'

import { createApi } from '~/audius-query'
import { ID } from '~/models'
import { decodeHashId, encodeHashId } from '~/utils'

// Helper method to save on some copy-pasta
const optimisticUpdateComment = (
  id: string,
  updateRecipe: (prevState: Comment | undefined) => Comment,
  dispatch: ThunkDispatch<any, any, any>
) => {
  dispatch(
    commentsApi.util.updateQueryData(
      'getCommentById',
      {
        id
      },
      updateRecipe
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
      async onQuerySuccess(comments: Comment[], _args, { dispatch }) {
        comments.forEach((comment) => {
          optimisticUpdateComment(comment.id, () => comment, dispatch)
        })
      }
    },
    getCommentById: {
      async fetch({ id }: { id: string }, { audiusSdk }) {
        const sdk = await audiusSdk()
        const commentsRes = await sdk.comments.getComment({
          id
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
          parentCommentId: decodedParentCommentId ?? undefined // undefined is allowed but null is not
        })
        return commentsRes
      },
      options: { type: 'mutation' },
      async onQuerySuccess({ data: comment }, { entityId }, { dispatch }) {
        dispatch(
          commentsApi.util.updateQueryData(
            'getCommentsByTrackId',
            { entityId },
            (prevState) => {
              if (comment.parentCommentId) {
                // Comment is a reply in this case
                // Append to existing comment reply array
                // TODO: how should we handle sorting here?
                // TODO: do we even need to do this
                prevState
                  .find((c: Comment) => c.id === comment.parentCommentId)
                  ?.replies.push(comment)
                return prevState
              } else {
                // New top level comment, just add it into the mix
                // TODO: how should we handle sorting here?
                return [comment, ...prevState]
              }
            }
          )
        )
        optimisticUpdateComment(comment.id, () => comment, dispatch)
      }
    },

    // TODO: should this be optimistic or not?
    deleteCommentById: {
      async fetch(
        { id, userId, entityId }: { id: string; userId: ID; entityId: ID },
        { audiusSdk }
      ) {
        const decodedId = decodeHashId(id.toString())
        if (!decodedId) {
          console.error(
            `Error: Unable to delete comment. Id ${id} could not be decoded`
          )
          return
        }
        const commentData = {
          userId,
          entityId: decodedId
        }
        const sdk = await audiusSdk()
        await sdk.comments.deleteComment(commentData)
      },
      options: { type: 'mutation' }
    },
    // Optimistic mutations
    editCommentById: {
      async fetch(
        {
          id,
          userId,
          newMessage,
          entityType = EntityType.TRACK // Comments only on tracks for now; likely to expand to collections in the future
        }: {
          id: string
          userId: ID
          newMessage: string
          entityType?: EntityType
        },
        { audiusSdk }
      ) {
        const decodedId = decodeHashId(id)
        if (!decodedId) {
          console.error(
            `Error: Unable to edit comment. Id ${id} could not be decoded`
          )
          return
        }
        const commentData = {
          body: newMessage,
          userId,
          entityId: decodedId,
          entityType
        }
        const sdk = await audiusSdk()
        await sdk.comments.editComment(commentData)
      },
      options: { type: 'mutation' },
      async onQueryStarted({ id, newMessage }, { dispatch }) {
        optimisticUpdateComment(
          id,
          (comment) => ({ ...(comment as Comment), message: newMessage }),
          dispatch
        )
      }
    },
    pinCommentById: {
      async fetch({ id, userId }: { id: string; userId: ID }) {
        // TODO: call sdk here
      },
      options: { type: 'mutation' },
      async onQueryStarted({ id }, { dispatch }) {
        optimisticUpdateComment(
          id,
          (comment) => ({
            ...(comment as Comment),
            isPinned: !comment?.isPinned
          }),
          dispatch
        )
      }
    },
    reactToCommentById: {
      async fetch(
        { id, userId, isLiked }: { id: string; userId: ID; isLiked: boolean },
        { audiusSdk }
      ) {
        const sdk = await audiusSdk()
        const decodedId = decodeHashId(id)
        if (!decodedId) {
          console.error(
            `Error: Unable to react to comment. Id ${id} could not be decoded`
          )
          return
        }
        await sdk.comments.reactComment(userId, decodedId, isLiked)
      },
      options: { type: 'mutation' },
      async onQueryStarted({ id, isLiked }, { dispatch }) {
        optimisticUpdateComment(
          id,
          (comment) => ({
            ...(comment as Comment),
            reactCount: comment?.reactCount + isLiked ? 1 : -1
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
