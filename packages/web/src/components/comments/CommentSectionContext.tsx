/* eslint-disable no-console */
import { PropsWithChildren, createContext, useContext, useState } from 'react'

import { ID } from '@audius/common/models'
import { Nullable, encodeHashId } from '@audius/common/utils'
import { EntityType } from '@audius/sdk'
import { useAsync } from 'react-use'

import { audiusSdk } from 'services/audius-sdk'

import { MOCK_COMMENT_DATA } from './mock-data'
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
}

const emptyFn = () => {}
const initialContextValues: CommentSectionContextType = {
  userId: null,
  entityId: -1,
  entityType: EntityType.TRACK,
  isLoading: true,
  comments: [],
  handlePostComment: emptyFn,
  handleReactComment: emptyFn,
  handlePinComment: emptyFn,
  handleEditComment: emptyFn,
  handleDeleteComment: emptyFn,
  handleReportComment: emptyFn
}

export const CommentSectionContext =
  createContext<CommentSectionContextType>(initialContextValues)

export const CommentSectionProvider = ({
  userId,
  entityId,
  entityType = EntityType.TRACK,
  children
}: PropsWithChildren<CommentSectionContextProps>) => {
  const [comments, setComments] = useState(initialContextValues.comments)

  // TODO: temporarily including state management here to optimistic update and avoid constantly needing to refresh
  const addComment = (comment: Comment) => {
    const newComments = [comment, ...comments]
    setComments(newComments)
  }

  const addReply = (comment: CommentReply, parentCommentIndex: number) => {
    const newComments = [...comments]
    const parentComment = newComments[parentCommentIndex]
    parentComment.replies = [...(parentComment.replies || []), comment]
    setComments(newComments)
  }

  const [isLoading, setIsLoading] = useState(initialContextValues.isLoading)

  const handlePostComment = async (
    message: string,
    parentCommentId?: ID,
    parentCommentIndex?: number
  ) => {
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

        // TEMPORARY optimistic update for now
        const optimisticCommentData = {
          id: null, // idk
          userId,
          message,
          react_count: 0,
          is_pinned: false,
          created_at: new Date(),
          replies: null
        } as unknown as CommentReply
        if (parentCommentIndex !== undefined) {
          addReply(optimisticCommentData, parentCommentIndex)
        } else {
          addComment(optimisticCommentData)
        }
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
  const handlePinComment = (commentId: ID) => {
    console.log('Clicked pin for ', commentId)
  }
  const handleEditComment = async (commentId?: ID, newMessage: string) => {
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
    if (userId && entityId) {
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

  const handleReportComment = (commentId: ID) => {
    console.log('Clicked report for ', commentId)
  }

  // TODO: move this to audius-query
  // load comments logic
  useAsync(async () => {
    if (entityId) {
      try {
        setIsLoading(true)
        const sdk = await audiusSdk()
        const commentsRes = await sdk.tracks.trackComments({
          trackId: encodeHashId(entityId)
        })
        if (commentsRes?.data) {
          // TODO: Shouldn't need to cast; need to figure out how to work with SDK types
          setComments(commentsRes.data as unknown as Comment[])
        }
        setIsLoading(false)
      } catch (e) {
        setComments(MOCK_COMMENT_DATA) // TODO: eventually remove, this is backup mock data for UI testing
        setIsLoading(false)
        console.log('COMMENTS DEBUG: Error fetching comments', e)
      }
    }
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
        handlePinComment,
        handleEditComment,
        handleDeleteComment,
        handleReportComment
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
