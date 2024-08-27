/* eslint-disable no-console */
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useState
} from 'react'

import { EntityType, Comment } from '@audius/sdk'
import { useDispatch, useSelector } from 'react-redux'

import { usePaginatedQuery } from '..//audius-query'
import { ID, Status } from '..//models'
import { Nullable } from '..//utils'
import {
  useDeleteCommentById,
  useEditCommentById,
  useGetCommentsByTrackId,
  usePinCommentById,
  usePostComment as useAQueryPostComment,
  useReactToCommentById,
  useGetCurrentUserId,
  useGetTrackById
} from '../api'
import { tracksActions } from '../store/pages/track/lineup/actions'
import { playerSelectors } from '../store/player'

export enum CommentSortMethod {
  top = 'top',
  newest = 'newest',
  timestamp = 'timestamp'
}

type CommentSectionContextType = {
  currentUserId: Nullable<ID>
  artistId: ID
  entityId: ID
  entityType?: EntityType.TRACK
  isEntityOwner: boolean
  playTrack: () => void
  commentSectionLoading: boolean
  comments: Comment[]
  currentSort: CommentSortMethod
  setCurrentSort: (sort: CommentSortMethod) => void
  handleLoadMoreRootComments: () => void
  handleLoadMoreReplies: (commentId: string) => void
  handleMuteEntityNotifications: () => void
}

export const CommentSectionContext = createContext<
  CommentSectionContextType | undefined
>(undefined)

type CommentSectionProviderProps = {
  entityId: ID
  entityType?: EntityType.TRACK
}

export const CommentSectionProvider = (
  props: PropsWithChildren<CommentSectionProviderProps>
) => {
  const { entityId, entityType, children } = props
  const { data: track } = useGetTrackById({ id: entityId })
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
  const { data: currentUserId } = useGetCurrentUserId({})
  const [currentSort, setCurrentSort] = useState<CommentSortMethod>(
    CommentSortMethod.top
  )
  const dispatch = useDispatch()
  const playerUid = useSelector(playerSelectors.getUid) ?? undefined
  const playTrack = useCallback(() => {
    dispatch(tracksActions.play(playerUid))
  }, [dispatch, playerUid])

  const commentSectionLoading =
    status === Status.LOADING || status === Status.IDLE

  const handleLoadMoreRootComments = () => {
    loadMore()
  }
  const handleLoadMoreReplies = (commentId: string) => {
    console.log('Loading more replies for', commentId)
  }
  const handleMuteEntityNotifications = () => {
    console.log('Muting all notifs for ', entityId)
  }

  if (!track) {
    return null
  }

  const { owner_id } = track

  return (
    <CommentSectionContext.Provider
      value={{
        currentUserId,
        artistId: owner_id,
        entityId,
        entityType,
        comments,
        commentSectionLoading,
        isEntityOwner: currentUserId === owner_id,
        currentSort,
        setCurrentSort,
        playTrack,
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

export const usePostComment = () => {
  const { currentUserId, entityId, entityType } = useCurrentCommentSection()
  const [postComment, postCommentResponse] = useAQueryPostComment()

  const wrappedHandler = async (
    message: string,
    parentCommentId?: string,
    trackTimestampS?: number
  ) => {
    if (currentUserId) {
      postComment({
        userId: currentUserId,
        entityId,
        entityType,
        body: message,
        // @ts-ignore - TODO: the python API spec is incorrect here - this should be a string, not a number
        parentCommentId,
        trackTimestampS
      })
    }
  }
  return [wrappedHandler, postCommentResponse] as const
}

export const useReactToComment = () => {
  const [reactToComment, reactToCommentResponse] = useReactToCommentById()
  const { currentUserId } = useCurrentCommentSection()
  const wrappedHandler = async (commentId: string, isLiked: boolean) => {
    if (currentUserId) {
      reactToComment({ id: commentId, userId: currentUserId, isLiked })
    }
    // TODO: trigger auth flow here
  }
  return [wrappedHandler, reactToCommentResponse] as const
}

export const useEditComment = () => {
  const { currentUserId } = useCurrentCommentSection()
  const [editComment, editCommentResponse] = useEditCommentById()
  const wrappedHandler = async (commentId: string, newMessage: string) => {
    if (currentUserId) {
      editComment({ id: commentId, newMessage, userId: currentUserId })
    }
  }
  return [wrappedHandler, editCommentResponse] as const
}

export const usePinComment = () => {
  const { currentUserId } = useCurrentCommentSection()
  const [pinComment, pinCommentResponse] = usePinCommentById()
  const wrappedHandler = (commentId: string, isPinned: boolean) => {
    if (currentUserId) {
      pinComment({ id: commentId, userId: currentUserId, isPinned })
    }
  }
  return [wrappedHandler, pinCommentResponse] as const
}

export const useReportComment = () => {
  const wrappedHandler = (commentId: string) => {}
  return [wrappedHandler] as const
}

export const useDeleteComment = () => {
  const { currentUserId, entityId } = useCurrentCommentSection()
  const [deleteComment, response] = useDeleteCommentById()

  const wrappedHandler = (commentId: string) => {
    if (currentUserId) {
      deleteComment({ id: commentId, userId: currentUserId, entityId })
    }
  }
  return [wrappedHandler, response] as const // as const is needed to return a tuple
}
