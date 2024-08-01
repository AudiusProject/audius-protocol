import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useState
} from 'react'

import { ID } from '@audius/common/models'
import { Nullable, encodeHashId } from '@audius/common/utils'
import { EntityType } from '@audius/sdk/src/sdk/services/EntityManager/types'
import { useAsync } from 'react-use'

import { audiusSdk } from 'services/audius-sdk'

import { MOCK_COMMENT_DATA } from './mock-data'
import { Comment } from './types'

/**
 * Context object to avoid prop drilling, make data access easy, and avoid Redux 😉
 */

// Props passed in from above
type CommentSectionContextProps = {
  userId: Nullable<ID>
  entityId: ID
  entityType?: EntityType
}

// Props sent down to context (some are handled inside the context component)
type CommentSectionContextType = CommentSectionContextProps & {
  isLoading: boolean
  comments: Comment[]
  handlePostComment: (message: string, parentCommentId: ID | null) => void
  handleReactComment: (commentId: ID) => void
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
  const [isLoading, setIsLoading] = useState(initialContextValues.isLoading)

  // TODO: implement things with these
  const handlePostComment = useCallback(
    async (message: string, parentCommentId?: ID) => {
      console.log('sending comment')
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
          await sdk.comments.postComment(commentData)
        } catch (e) {
          console.log('COMMENTS DEBUG: Error posting comment', e)
        }
      }
    },
    [entityId, userId]
  )
  const handleReactComment = (commentId: ID) => {
    console.log('Clicked react for ', commentId)
  }
  const handlePinComment = (commentId: ID) => {
    console.log('Clicked pin for ', commentId)
  }
  const handleEditComment = useCallback(
    async (commentId?: ID, newMessage: string) => {
      console.log('edited comment: ', commentId, newMessage)
      if (userId && entityId) {
        try {
          const sdk = await audiusSdk()
          const commentData = {
            body: newMessage,
            userId,
            entityId: commentId,
            entityType: EntityType.TRACK // Comments are only on tracks for now; likely expand to collections in the future
          }
          await sdk.comments.editComment(commentData)
        } catch (e) {
          console.log('COMMENTS DEBUG: Error posting comment', e)
        }
      }
    },
    [entityId, userId]
  )
  const handleDeleteComment = useCallback(
    async (commentId?: ID) => {
      console.log('deleting comment: ', commentId)
      if (userId && entityId) {
        try {
          const sdk = await audiusSdk()
          const commentData = {
            userId,
            entityId: commentId
          }
          await sdk.comments.deleteComment(commentData)
        } catch (e) {
          console.log('COMMENTS DEBUG: Error posting comment', e)
        }
      }
    },
    [entityId, userId]
  )
  const handleReportComment = (commentId: ID) => {
    console.log('Clicked report for ', commentId)
  }

  // TODO: assuming we move this to audius-query
  useAsync(async () => {
    if (entityId) {
      try {
        setIsLoading(true)
        const sdk = await audiusSdk()
        const commentsRes = await sdk.tracks.trackComments({
          trackId: encodeHashId(entityId)
        })
        if (commentsRes?.data) {
          setComments(commentsRes.data as Comment[])
        }
        setIsLoading(false)
      } catch (e) {
        setComments(MOCK_COMMENT_DATA) // TODO: remove, was testing with staging
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
