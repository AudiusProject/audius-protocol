/* eslint-disable no-console */
import { PropsWithChildren, createContext, useContext } from 'react'

import {
  useDeleteCommentById,
  useEditCommentById,
  useGetCommentsByTrackId,
  usePinCommentById,
  useReactToCommentById
} from '@audius/common/api'
import { ID, Status } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import { CommentsApi, EntityType } from '@audius/sdk'
import { useAsync } from 'react-use'

import { audiusSdk } from 'services/audius-sdk'

import { Comment, CommentReply } from './types'

/**
 * Context object to avoid prop drilling, make data access easy, and avoid Redux 😉
 */

// Props passed in from above
type CommentSectionContextProps = {
  userId: Nullable<ID>
  entityId: ID
  entityType?: EntityType.TRACK
}

// Props sent down to context (some are handled inside the context component)
type CommentSectionContextType = CommentSectionContextProps & {
  isLoading: boolean
  comments: Comment[]
  handlePostComment: (
    message: string,
    parentCommentId?: ID,
    parentCommentIndex?: number
  ) => void
  handleReactComment: (commentId: ID, isLiked: boolean) => void
  handlePinComment: (commentId: ID) => void
  handleEditComment: (commentId: ID, newMessage: string) => void
  handleDeleteComment: (commentId: ID) => void
  handleReportComment: (commentId: ID) => void
  handleLoadMoreRootComments: () => void
  handleLoadMoreReplies: (commentId: ID) => void
  fetchComments: () => void
}

const emptyFn = () => {}
const initialContextValues: CommentSectionContextType = {
  userId: null,
  entityId: 0, // this matches the default track id in TrackPage
  entityType: EntityType.TRACK,
  isLoading: true,
  comments: [],
  handlePostComment: emptyFn,
  handleReactComment: emptyFn,
  handlePinComment: emptyFn,
  handleEditComment: emptyFn,
  handleDeleteComment: emptyFn,
  handleReportComment: emptyFn,
  handleLoadMoreRootComments: emptyFn,
  handleLoadMoreReplies: emptyFn,
  fetchComments: emptyFn
}

export const CommentSectionContext =
  createContext<CommentSectionContextType>(initialContextValues)

export const CommentSectionProvider = ({
  userId,
  entityId,
  entityType = EntityType.TRACK,
  children
}: PropsWithChildren<CommentSectionContextProps>) => {
  const commentRes = useGetCommentsByTrackId(
    { entityId },
    { disabled: entityId === 0, force: true }
  )
  // const [editComment] = useEditCommentById()
  // const [reactToComment] = useReactToCommentById()
  // const [pinComment] = usePinCommentById()
  // const [deleteComment] = useDeleteCommentById()

  const comments = commentRes.data ?? []
  const isLoading =
    commentRes.status === Status.LOADING || commentRes.status === Status.IDLE

  const handlePostComment = async (message: string, parentCommentId?: ID) => {
    if (userId && entityId) {
      try {
        const sdk = await audiusSdk()
        const commentData = {
          body: message,
          userId,
          entityId,
          entityType: EntityType.TRACK, // Comments are only on tracks for now; likely expand to collections in the future
          parentCommentId // aka reply
        }
        // API call
        await sdk.comments.postComment(commentData)
      } catch (e) {
        console.log('COMMENTS DEBUG: Error posting comment', e)
      }
    }
  }

  // TODO: these are all empty for now
  const handleReactComment = async (commentId: number, isLiked: boolean) => {
    const sdk = await audiusSdk()
    if (userId) {
      await sdk.comments.reactComment(userId, commentId, isLiked)
    }
  }
  // const handleEditComment = (id: ID, newMessage: string) => {
  //   editComment({ id, newMessage })
  // }
  const handleEditComment = async (commentId: ID, newMessage: string) => {
    if (userId && entityId) {
      try {
        const commentData = {
          body: newMessage,
          userId,
          entityId: commentId,
          entityType: EntityType.TRACK // Comments are only on tracks for now; likely expand to collections in the future
        }
        const sdk = await audiusSdk()
        await sdk.comments.editComment(commentData)
      } catch (e) {
        console.log('COMMENTS DEBUG: Error posting comment', e)
      }
    }
  }
  const handleDeleteComment = async (commentId?: ID) => {
    if (userId && commentId) {
      try {
        const commentData = {
          userId,
          entityId: commentId
        }
        const sdk = await audiusSdk()
        await sdk.comments.deleteComment(commentData)
      } catch (e) {
        console.log('COMMENTS DEBUG: Error posting comment', e)
      }
    }
  }

  const handleLoadMoreRootComments = () => {
    console.log('Loading more root comments')
  }
  const handleLoadMoreReplies = (commentId: ID) => {
    console.log('Loading more replies for', commentId)
  }

  // TODO: move this to audius-query
  // load comments logic
  const fetchComments = async () => {}

  useAsync(async () => {
    fetchComments()
  }, [entityId])

  return (
    <CommentSectionContext.Provider
      value={{
        userId,
        entityId,
        entityType,
        comments,
        isLoading,
        handlePostComment,
        handleReactComment,
        handleEditComment,
        handleDeleteComment,
        handleLoadMoreReplies,
        handleLoadMoreRootComments,
        fetchComments // todo: temporary - remove later
      }}
    >
      {children}
    </CommentSectionContext.Provider>
  )
}

export const useCurrentCommentSection = () => {
  const context = useContext(CommentSectionContext)

  if (!context) {
    throw new Error(
      'useCurrentCommentSection must be used within a CommentSectionProvider'
    )
  }

  return context
}
