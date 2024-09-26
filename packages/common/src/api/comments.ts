import {
  EntityType,
  TrackCommentsSortMethodEnum,
  CommentMetadata,
  EntityManagerAction
} from '@audius/sdk'
import { ThunkDispatch } from '@reduxjs/toolkit'

import {
  commentFromSDK,
  replyCommentFromSDK,
  transformAndCleanList
} from '~/adapters'
import { createApi } from '~/audius-query'
import { Comment, ReplyComment, ID } from '~/models'
import { Nullable, encodeHashId } from '~/utils'

// Helper method to save on some copy-pasta
// Updates the array of all comments
const optimisticUpdateCommentList = (
  entityId: number,
  updateRecipe: (prevState: Comment[] | undefined) => void, // Could also return Comment[] but its easier to modify the prevState proxy array directly
  dispatch: ThunkDispatch<any, any, any>,
  userId?: number,
  page: number = 0,
  sortMethod: TrackCommentsSortMethodEnum = TrackCommentsSortMethodEnum.Top
) => {
  dispatch(
    commentsApi.util.updateQueryData(
      'getCommentsByTrackId',
      { entityId, userId, limit: 5, offset: page, sortMethod },
      updateRecipe
    )
  )
}

// Helper method to save on some copy-pasta
// Updates a specific comment
const optimisticUpdateComment = (
  id: ID,
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
        return transformAndCleanList(commentsRes.data, commentFromSDK)
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
      async fetch({ id: _id }: { id: ID }): Promise<Comment | undefined> {
        // NOTE: we currently do not have an endpoint for this
        // We ultimately only use this query expecting to hit the cache
        // TODO: add this endpoint "just in case"
        return undefined
      },
      options: {}
    },
    getCommentRepliesById: {
      async fetch(
        { id, limit, offset }: { id: ID; limit?: number; offset?: number },
        { audiusSdk }
      ) {
        const sdk = await audiusSdk()
        const commentsRes = await sdk.comments.getCommentReplies({
          commentId: encodeHashId(id),
          limit,
          offset
        })
        return transformAndCleanList(commentsRes?.data, replyCommentFromSDK)
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
        { audiusSdk },
        { newId }: { newId: ID }
      ) {
        const sdk = await audiusSdk()

        const commentsRes = await sdk.comments.postComment({
          ...commentData,
          commentId: newId,
          parentCommentId
        })
        return commentsRes
      },
      options: { type: 'mutation' },
      async onQueryStarted(
        { entityId, body, userId, trackTimestampS, parentCommentId },
        { dispatch }
      ) {
        const newId = Math.floor(Math.random() * 1000000) // TODO: need to request an unused id instead of a random number
        const newComment: Comment = {
          id: newId,
          userId,
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
              if (prevState && Array.isArray(prevState)) {
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
        return { tempId: newId }
      }
    },
    deleteCommentById: {
      async fetch(
        { id, userId }: { id: ID; userId: ID; entityId: ID },
        { audiusSdk }
      ) {
        const commentData = { userId, entityId: id }
        const sdk = await audiusSdk()
        return await sdk.comments.deleteComment(commentData)
      },
      options: { type: 'mutation' },
      onQueryStarted({ id, entityId, userId }, { dispatch }) {
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
          entityType = EntityType.TRACK,
          mentions
        }: {
          id: ID
          userId: ID
          newMessage: string
          entityType?: EntityType
          mentions?: ID[]
        },
        { audiusSdk }
      ) {
        const commentData = {
          body: newMessage,
          userId,
          entityId: id,
          entityType,
          mentions
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
        { id, userId, isPinned }: { id: ID; userId: ID; isPinned: boolean },
        { audiusSdk }
      ) {
        const sdk = await audiusSdk()
        await sdk.comments.pinComment(userId, id, isPinned)
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
          id: ID
          userId: ID
          isLiked: boolean
          isEntityOwner?: boolean
        },
        { audiusSdk }
      ) {
        const sdk = await audiusSdk()
        await sdk.comments.reactComment(userId, id, isLiked)
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
        { id, userId }: { id: ID; userId: ID; entityId: ID },
        { audiusSdk }
      ) {
        const sdk = await audiusSdk()
        await sdk.comments.reportComment(userId, id)
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
    getTrackCommentNotificationSetting: {
      fetch: async (
        {
          trackId,
          currentUserId
        }: { trackId: ID; currentUserId: Nullable<ID> },
        { audiusSdk }
      ) => {
        if (!currentUserId) return
        const sdk = await audiusSdk()
        const response = await sdk.tracks.trackCommentNotificationSetting({
          trackId: encodeHashId(trackId),
          userId: encodeHashId(currentUserId)
        })

        return response.data?.isMuted
      },
      options: {}
    },
    updateCommentNotificationSettings: {
      async fetch(
        config: {
          userId: ID
          entityId: ID
          entityType: EntityType
          action: EntityManagerAction.MUTE | EntityManagerAction.UNMUTE
        },

        { audiusSdk }
      ) {
        const sdk = await audiusSdk()
        await sdk.comments.updateCommentNotificationSetting(config)
      },
      options: { type: 'mutation' }
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
  useGetTrackCommentNotificationSetting,
  useUpdateCommentNotificationSettings
} = commentsApi.hooks

export const commentsApiFetch = commentsApi.fetch

export const commentsApiReducer = commentsApi.reducer
