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
  dispatch: ThunkDispatch<any, any, any>,
  page: number = 0
) => {
  dispatch(
    commentsApi.util.updateQueryData(
      'getCommentsByTrackId',
      { entityId, limit: 5, offset: page },
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
      async fetch(
        {
          entityId,
          offset,
          limit
        }: { entityId: ID; offset?: number; limit?: number },
        { audiusSdk }
      ) {
        const sdk = await audiusSdk()
        const commentsRes = await sdk.tracks.trackComments({
          trackId: encodeHashId(entityId),
          offset,
          limit
        })
        return commentsRes?.data ?? []
      },
      options: { type: 'paginatedQuery' },
      async onQuerySuccess(comments: Comment[], _args, { dispatch }) {
        comments.forEach((comment) => {
          optimisticUpdateComment(comment.id, () => comment, dispatch)
        })
      }
    },
    getCommentById: {
      async fetch({ id: _id }: { id: string }): Promise<Comment | undefined> {
        // NOTE: we currently do not have an endpoint for this
        // We ultimately only use this query expecting to hit the cache
        return undefined
      },
      options: { type: 'query' }
    },
    getCommentRepliesById: {
      async fetch(
        { id, limit, offset }: { id: string; limit?: number; offset?: number },
        { audiusSdk }
      ) {
        const sdk = await audiusSdk()
        const commentsRes = await sdk.comments.getCommentReplies({
          commentId: id,
          limit,
          offset
        })
        // TODO: type issue here?
        return commentsRes?.data as unknown as Comment[]
      },
      options: { type: 'paginatedQuery' }
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
        newId,
        { entityId, body, userId, trackTimestampS, parentCommentId },
        { dispatch }
      ) {
        const newComment: Comment = {
          id: newId,
          userId: `${userId}`,
          message: body,
          isPinned: false,
          trackTimestampS,
          reactCount: 0,
          replies: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: undefined
        }
        optimisticUpdateComment(
          parentCommentId ?? newId,
          (parentComment) => {
            // Handle replies. Need to find the parent and add the new comment to the replies array
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
      }
    },
    deleteCommentById: {
      async fetch(
        { id, userId }: { id: string; userId: ID; entityId: ID },
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
      async fetch({
        id: _id,
        userId: _userId,
        isPinned
      }: {
        id: string
        userId: ID
        isPinned: boolean
      }) {
        // TODO: call sdk here
        // return null
      },
      options: { type: 'mutation' },
      onQueryStarted({ id, isPinned }, { dispatch }) {
        optimisticUpdateComment(
          id,
          (comment) => {
            if (comment) {
              comment.isPinned = isPinned
            }
          },
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
            reactCount: (comment?.reactCount ?? 0) + (isLiked ? 1 : -1)
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
  useReactToCommentById,
  useGetCommentRepliesById
} = commentsApi.hooks

export const commentsApiFetch = commentsApi.fetch

export const commentsApiReducer = commentsApi.reducer
