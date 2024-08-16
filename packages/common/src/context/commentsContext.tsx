/* eslint-disable no-console */
import { PropsWithChildren, createContext, useContext } from 'react'

import { EntityType, Comment } from '@audius/sdk'

import { MutationHookResponse, usePaginatedQuery } from '..//audius-query'
import { ID, Status } from '..//models'
import { Nullable } from '..//utils'
import {
  useDeleteCommentById,
  useEditCommentById,
  useGetCommentsByTrackId,
  usePinCommentById,
  usePostComment as useAQueryPostComment,
  useReactToCommentById
} from '../api'

/**
 * Context object to avoid prop drilling and share a common API with web/native code
 */

// Props passed in from above (also get forwarded thru)
type CommentSectionContextProps = {
  artistId: ID
  userId: Nullable<ID>
  entityId: ID
  entityType?: EntityType.TRACK
  isEntityOwner: boolean
  playTrack: () => void
}

// Helper type to rewrap our mutation hooks with data from this context
type WrappedMutationHook<MutationWrapper, ReturnDataType> = () => [
  MutationWrapper,
  MutationHookResponse<ReturnDataType>
]

// Props sent down to context (some are handled inside the context component)
type CommentSectionContextType = CommentSectionContextProps & {
  commentSectionLoading: boolean
  comments: Comment[]
  usePostComment: WrappedMutationHook<
    (
      message: string,
      parentCommentId?: string,
      trackTimestampS?: number
    ) => void,
    number
  >
  useReactToComment: WrappedMutationHook<
    (commentId: string, isLiked: boolean) => void,
    void
  >
  usePinComment: WrappedMutationHook<(commentId: string) => void, void>
  useEditComment: WrappedMutationHook<
    (commentId: string, newMessage: string) => void,
    void
  >
  useDeleteComment: WrappedMutationHook<(commentId: string) => void, any>
  useReportComment: WrappedMutationHook<(commentId: string) => void, void>
  handleLoadMoreRootComments: () => void
  handleLoadMoreReplies: (commentId: string) => void
  handleMuteEntityNotifications: () => void
}

export const CommentSectionContext = createContext<
  CommentSectionContextType | undefined
>(undefined)

export const CommentSectionProvider = ({
  artistId,
  userId,
  entityId,
  isEntityOwner,
  entityType = EntityType.TRACK,
  children,
  playTrack
}: PropsWithChildren<CommentSectionContextProps>) => {
  const {
    data: comments = [],
    status,
    loadMore
  } = usePaginatedQuery(
    // @ts-ignore - TODO: theres something wrong here in the audius-query types
    useGetCommentsByTrackId,
    { entityId },
    {
      pageSize: 5,
      force: true,
      disabled: entityId === 0
    }
  )
  const [editComment, editCommentResponse] = useEditCommentById()
  const [postComment, postCommentResponse] = useAQueryPostComment()
  const [reactToComment, reactToCommentResponse] = useReactToCommentById()
  const [pinComment, pinCommentResponse] = usePinCommentById()
  const [deleteComment, deleteCommentResponse] = useDeleteCommentById()

  const commentSectionLoading =
    status === Status.LOADING || status === Status.IDLE

  const usePostComment: CommentSectionContextType['usePostComment'] = () => {
    const wrappedHandler = async (
      message: string,
      parentCommentId?: string,
      trackTimestampS?: number
    ) => {
      if (userId) {
        postComment({
          userId,
          entityId,
          entityType,
          body: message,
          // @ts-ignore - TODO: the python API spec is incorrect here - this should be a string, not a number
          parentCommentId,
          trackTimestampS
        })
      }
    }
    return [wrappedHandler, postCommentResponse]
  }

  const useReactToComment: CommentSectionContextType['useReactToComment'] =
    () => {
      const wrappedHandler = async (commentId: string, isLiked: boolean) => {
        if (userId) {
          reactToComment({ id: commentId, userId, isLiked })
        }
        // TODO: trigger auth flow here
      }
      return [wrappedHandler, reactToCommentResponse]
    }
  const useEditComment: CommentSectionContextType['useEditComment'] = () => {
    const wrappedHandler = async (commentId: string, newMessage: string) => {
      if (userId) {
        editComment({ id: commentId, newMessage, userId })
      }
    }
    return [wrappedHandler, editCommentResponse]
  }

  const useDeleteComment: CommentSectionContextType['useDeleteComment'] =
    () => {
      const wrappedHandler = async (commentId: string) => {
        if (userId) {
          deleteComment({ id: commentId, userId, entityId })
        }
      }
      return [wrappedHandler, deleteCommentResponse]
    }

  const usePinComment: CommentSectionContextType['usePinComment'] = () => {
    const wrappedHandler = (commentId: string) => {
      if (userId) {
        pinComment({ id: commentId, userId })
      }
    }
    return [wrappedHandler, pinCommentResponse]
  }

  const useReportComment: CommentSectionContextType['useReportComment'] =
    () => {
      const wrappedHandler = (commentId: string) => {}
      return [wrappedHandler, pinCommentResponse]
    }

  const handleLoadMoreRootComments = () => {
    loadMore()
  }
  const handleLoadMoreReplies = (commentId: string) => {
    console.log('Loading more replies for', commentId)
  }
  const handleMuteEntityNotifications = () => {
    console.log('Muting all notifs for ', entityId)
  }

  return (
    <CommentSectionContext.Provider
      value={{
        artistId,
        userId,
        entityId,
        entityType,
        comments,
        commentSectionLoading,
        playTrack,
        isEntityOwner,
        usePostComment,
        useDeleteComment,
        useEditComment,
        usePinComment,
        useReactToComment,
        useReportComment,
        handleLoadMoreReplies,
        handleLoadMoreRootComments,
        handleMuteEntityNotifications
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
