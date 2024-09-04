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

import {
  useGetCommentsByTrackId,
  useGetCurrentUserId,
  useGetTrackById
} from '../../api'
import { ID, PaginatedStatus, Status } from '../../models'
import { tracksActions } from '../../store/pages/track/lineup/actions'
import { playerSelectors } from '../../store/player'
import { Nullable } from '../../utils'

export enum CommentSortMethod {
  top = 'top',
  newest = 'newest',
  timestamp = 'timestamp'
}

type CommentSectionProviderProps = {
  entityId: ID
  entityType?: EntityType.TRACK

  // These are optional because they are only used on mobile
  // and provided for the components in CommentDrawer
  replyingToComment?: Comment
  setReplyingToComment?: (comment: Comment) => void
  editingComment?: Comment
  setEditingComment?: (comment: Comment) => void
}

type CommentSectionContextType = {
  currentUserId: Nullable<ID>
  artistId: ID
  isEntityOwner: boolean
  playTrack: () => void
  commentSectionLoading: boolean
  comments: Comment[]
  currentSort: CommentSortMethod
  isLoadingMorePages: boolean
  hasMorePages: boolean
  reset: (hard?: boolean) => void
  setCurrentSort: (sort: CommentSortMethod) => void
  loadMorePages: () => void
  handleLoadMoreReplies: (commentId: string) => void
  handleMuteEntityNotifications: () => void
} & CommentSectionProviderProps

export const CommentSectionContext = createContext<
  CommentSectionContextType | undefined
>(undefined)

export const CommentSectionProvider = (
  props: PropsWithChildren<CommentSectionProviderProps>
) => {
  const {
    entityId,
    entityType = EntityType.TRACK,
    children,
    replyingToComment,
    setReplyingToComment,
    editingComment,
    setEditingComment
  } = props
  const { data: track } = useGetTrackById({ id: entityId })
  const {
    data: comments = [],
    status,
    loadMore,
    reset,
    hasMore: hasMorePages
  } = useGetCommentsByTrackId(
    { entityId },
    {
      pageSize: 5,
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
        isLoadingMorePages: status === PaginatedStatus.LOADING_MORE,
        reset,
        hasMorePages,
        currentSort,
        replyingToComment,
        setReplyingToComment,
        editingComment,
        setEditingComment,
        setCurrentSort,
        playTrack,
        handleLoadMoreReplies,
        loadMorePages: loadMore,
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
