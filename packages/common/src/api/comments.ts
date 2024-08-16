import { EntityType, Comment } from '@audius/sdk'
import { CommentMetadata } from '@audius/sdk/dist/sdk/api/comments/CommentsAPI'
import { ThunkDispatch } from '@reduxjs/toolkit'

import { createApi } from '~/audius-query'
import { ID } from '~/models'
import { decodeHashId, encodeHashId } from '~/utils'

// Helper method to save on some copy-pasta
// Updates the array of all comments
const optimisticUpdateCommentList = (
  entityId: number,
  updateRecipe: (prevState: Comment[] | undefined) => void, // Could also return Comment[] but its easier to modify the prevState proxy array directly
  dispatch: ThunkDispatch<any, any, any>
) => {
  dispatch(
    commentsApi.util.updateQueryData(
      'getCommentsByTrackId',
      { entityId },
      updateRecipe
    )
  )
}

// Helper method to save on some copy-pasta
// Updates a specific comment
const optimisticUpdateComment = (
  id: string,
  updateRecipe: (prevState: Comment | undefined) => Comment | void,
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
    // Non-optimistically updated mutations (updates after confirmation)
    postComment: {
      async fetch(
        { parentCommentId, ...commentData }: CommentMetadata,
        { audiusSdk }
      ) {
        const sdk = await audiusSdk()
        const decodedParentCommentId =
          decodeHashId(parentCommentId?.toString() ?? '') ?? undefined // undefined is allowed but null is not
        const commentsRes = await sdk.comments.postComment({
          ...commentData,
          parentCommentId: decodedParentCommentId
        })
        return commentsRes
      },
      options: { type: 'mutation' },
      async onQuerySuccess(
        { data: newId },
        { entityId, body, userId, trackTimestampS, parentCommentId },
        { dispatch }
      ) {
        const newComment: Comment = {
          id: newId,
          userId,
          message: body,
          isPinned: false,
          trackTimestampS,
          reactCount: 0,
          replies: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: undefined
        }
        optimisticUpdateCommentList(
          entityId,
          (prevState) => {
            if (prevState) {
              if (parentCommentId) {
                const parentCommentIndex = prevState?.findIndex(
                  (comment) => comment.id === parentCommentId
                )
                if (parentCommentIndex && parentCommentIndex >= 0) {
                  const parentComment = prevState[parentCommentIndex]
                  parentComment.replies = parentComment.replies || []
                  parentComment.replies.push(newComment)
                }
              } else {
                prevState.unshift(newComment) // add new comment to top of comment section
              }
            }
          },
          dispatch
        )
        optimisticUpdateComment(
          parentCommentId ?? newId,
          (parentComment) => {
            if (parentCommentId && parentComment) {
              parentComment.replies = parentComment.replies || []
              parentComment.replies.push(newComment)
              return parentComment
            } else {
              return newComment
            }
          },
          dispatch
        )
      }
    },
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
        return await sdk.comments.deleteComment(commentData)
      },
      options: { type: 'mutation' },
      onQuerySuccess(_res, { id, entityId }, { dispatch }) {
        optimisticUpdateCommentList(
          entityId,
          (prevState) => {
            const indexToRemove = prevState?.findIndex(
              (comment: Comment) => comment.id === id
            )
            if (indexToRemove !== undefined && indexToRemove >= 0) {
              prevState?.splice(indexToRemove, 1)
            }
            return prevState
          },
          dispatch
        )
      }
    },
    // Optimistically updated mutations
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
      async fetch({ id: _id, userId: _userId }: { id: string; userId: ID }) {
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
