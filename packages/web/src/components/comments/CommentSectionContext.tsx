/* eslint-disable no-console */
import { PropsWithChildren, createContext, useContext } from 'react'

import {
  useDeleteCommentById,
  useEditCommentById,
  useGetCommentsByTrackId,
  usePinCommentById,
  usePostComment,
  useReactToCommentById
} from '@audius/common/api'
import { usePaginatedQuery } from '@audius/common/audius-query'
import { ID, Status } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import { EntityType } from '@audius/sdk'

import { Comment } from './types'

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
  handleLoadMoreReplies: emptyFn
}

export const CommentSectionContext =
  createContext<CommentSectionContextType>(initialContextValues)

export const CommentSectionProvider = ({
  userId,
  entityId,
  entityType = EntityType.TRACK,
  children
}: PropsWithChildren<CommentSectionContextProps>) => {
  const {
    data: comments = [],
    status,
    loadMore
  } = usePaginatedQuery(
    useGetCommentsByTrackId,
    { entityId },
    {
      pageSize: 5,
      force: true,
      disabled: entityId === 0
    }
  )
  const [editComment] = useEditCommentById()
  const [postComment] = usePostComment()
  const [reactToComment] = useReactToCommentById()
  const [pinComment] = usePinCommentById()
  const [deleteComment] = useDeleteCommentById()

  const isLoading = status === Status.LOADING || status === Status.IDLE

  const handlePostComment = async (message: string, parentCommentId?: ID) => {
    if (userId) {
      postComment({
        userId,
        entityId,
        entityType,
        body: message,
        parentCommentId
      })
    }
  }

  // TODO: these are all empty for now
  const handleReactComment = async (commentId: number, isLiked: boolean) => {
    if (userId) {
      reactToComment({ id: commentId, userId, isLiked })
    }
    // TODO: trigger auth flow here
  }

  const handleEditComment = async (commentId: ID, newMessage: string) => {
    if (userId) {
      editComment({ id: commentId, newMessage, userId })
    }
  }
  const handleDeleteComment = async (commentId: ID) => {
    if (userId) {
      deleteComment({ id: commentId, userId })
    }
  }

  const handlePinComment = (commentId: ID) => {
    if (userId) {
      pinComment({ id: commentId, userId })
    }
  }
  const handleLoadMoreRootComments = () => {
    loadMore()
  }
  const handleLoadMoreReplies = (commentId: ID) => {
    console.log('Loading more replies for', commentId)
  }

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
        handlePinComment,
        handleDeleteComment,
        handleLoadMoreReplies,
        handleLoadMoreRootComments
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
