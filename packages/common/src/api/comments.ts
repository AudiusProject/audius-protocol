import {
  EntityType,
  Comment,
  TrackCommentsSortMethodEnum,
  CommentMetadata,
  ReplyComment
} from '@audius/sdk'
import { ThunkDispatch } from '@reduxjs/toolkit'

import { createApi } from '~/audius-query'
import { ID } from '~/models'
import { Nullable, decodeHashId, encodeHashId } from '~/utils'

// Helper method to save on some copy-pasta
// Updates the array of all comments
const optimisticUpdateCommentList = (
  entityId: number,
  updateRecipe: (prevState: Comment[] | undefined) => void, // Could also return Comment[] but its easier to modify the prevState proxy array directly
  dispatch: ThunkDispatch<any, any, any>,
  userId?: number,
  page: number = 0
) => {
  dispatch(
    commentsApi.util.updateQueryData(
      'getCommentsByTrackId',
      { entityId, userId, limit: 5, offset: page },
      updateRecipe
    )
  )
}

// Helper method to save on some copy-pasta
// Updates a specific comment
const optimisticUpdateComment = (
  id: string,
  updateRecipe: (
    prevState: Comment | ReplyComment | undefined
  ) => Comment | ReplyComment | void,
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
          limit,
          sortMethod,
          userId
        }: {
          entityId: ID
          offset?: number
          limit?: number
          sortMethod?: TrackCommentsSortMethodEnum
          userId?: Nullable<ID>
        },
        { audiusSdk }
      ) {
        const sdk = await audiusSdk()
        const commentsRes = await sdk.tracks.trackComments({
          trackId: encodeHashId(entityId),
          offset,
          limit,
          sortMethod,
          userId: userId?.toString() ?? undefined
        })
        return commentsRes?.data ?? []
      },
      options: { type: 'paginatedQuery' },
      async onQuerySuccess(comments: Comment[], _args, { dispatch }) {
        comments.forEach((comment) => {
          optimisticUpdateComment(comment.id, () => comment, dispatch)
          comment.replies?.forEach((reply: ReplyComment) => {
            optimisticUpdateComment(reply.id, () => reply, dispatch)
          })
        })
      }
    },
    getCommentById: {
      async fetch({ id: _id }: { id: string }): Promise<Comment | undefined> {
        // NOTE: we currently do not have an endpoint for this
        // We ultimately only use this query expecting to hit the cache
        // TODO: add this endpoint "just in case"
        return undefined
      },
      options: {}
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
        return commentsRes?.data
      },
      options: { type: 'paginatedQuery' },
      onQuerySuccess(replies: Comment[], _args, { dispatch }) {
        // Insert new replies to our getCommentById slice
        replies.forEach((reply) => {
          optimisticUpdateComment(reply.id, () => reply, dispatch)
        })
      }
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
          isEdited: false,
          trackTimestampS,
          reactCount: 0,
          replyCount: 0,
          replies: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: undefined
        }
        // Add our new comment to the store
        optimisticUpdateComment(newId, () => newComment, dispatch)
        // If the comment is a reply, we need to update the parent comment's replies array
        if (parentCommentId) {
          optimisticUpdateComment(
            parentCommentId,
            (parentComment) => {
              // Handle replies. Need to find the parent and add the new comment to the replies array
              if (parentComment && 'replies' in parentComment) {
                parentComment.replies = parentComment.replies || []
                parentComment.replies.push(newComment)
              }
              return parentComment
            },
            dispatch
          )
        } else {
          // If the comment is not a reply we need to add it to the list of root level comments
          optimisticUpdateCommentList(
            entityId,
            (prevState) => {
              if (prevState) {
                prevState.unshift(newComment) // add new comment to top of comment section
                return prevState
              } else {
                return [newComment]
              }
            },
            dispatch,
            userId
          )
        }
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
      onQuerySuccess(_res, { id, entityId, userId }, { dispatch }) {
        optimisticUpdateCommentList(
          entityId,
          (prevState) => prevState?.filter((comment) => comment.id !== id),
          dispatch,
          userId
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
          (comment) => ({
            ...(comment as Comment),
            message: newMessage,
            isEdited: true
          }),
          dispatch
        )
      }
    },
    pinCommentById: {
      async fetch(
        { id, userId, isPinned }: { id: string; userId: ID; isPinned: boolean },
        { audiusSdk }
      ) {
        const decodedId = decodeHashId(id)
        if (!decodedId) {
          console.error(
            `Error: Unable to react to comment. Id ${id} could not be decoded`
          )
          return
        }
        const sdk = await audiusSdk()
        await sdk.comments.pinComment(userId, decodedId, isPinned)
      },
      options: { type: 'mutation' },
      onQueryStarted({ id, isPinned }, { dispatch }) {
        optimisticUpdateComment(
          id,
          (comment) => {
            if (comment && 'isPinned' in comment) {
              comment.isPinned = isPinned
            }
          },
          dispatch
        )
      }
    },
    reactToCommentById: {
      async fetch(
        {
          id,
          userId,
          isLiked,
          isEntityOwner: _isEntityOwner
        }: {
          id: string
          userId: ID
          isLiked: boolean
          isEntityOwner?: boolean
        },
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
      async onQueryStarted({ id, isLiked, isEntityOwner }, { dispatch }) {
        optimisticUpdateComment(
          id,
          (comment) => ({
            ...(comment as Comment),
            reactCount: (comment?.reactCount ?? 0) + (isLiked ? 1 : -1),
            isArtistReacted: isEntityOwner && isLiked
          }),
          dispatch
        )
      }
    },
    reportCommentById: {
      async fetch(
        { id, userId }: { id: string; userId: ID; entityId: ID },
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
        await sdk.comments.reportComment(userId, decodedId)
      },
      options: { type: 'mutation' },
      async onQueryStarted({ id, entityId, userId }, { dispatch }) {
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
          dispatch,
          userId
        )
      }
    },
    muteUserById: {
      async fetch(
        { mutedUserId, userId }: { mutedUserId: ID; userId: ID },
        { audiusSdk }
      ) {
        const sdk = await audiusSdk()
        console.log('asdf comments api calling mute user')
        await sdk.comments.muteUser(userId, mutedUserId)
      },
      options: { type: 'mutation' },
      async onQueryStarted({ mutedUserId, entityId, userId }, { dispatch }) {
        console.log('asdf onQueryStarted: ')
        optimisticUpdateCommentList(
          entityId,
          (prevState) => {
            const indexToRemove = prevState?.findIndex(
              (comment: Comment) => comment.userId === mutedUserId
            )
            if (indexToRemove !== undefined && indexToRemove >= 0) {
              console.log('asdf optimistic removing: ', comment)
              prevState?.splice(indexToRemove, 1)
            }
            return prevState
          },
          dispatch,
          userId
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
  useGetCommentRepliesById,
  useReportCommentById,
  useMuteUserById
} = commentsApi.hooks

export const commentsApiFetch = commentsApi.fetch

export const commentsApiReducer = commentsApi.reducer
