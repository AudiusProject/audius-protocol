/* eslint-disable no-console */
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'

import { EntityType, TrackCommentsSortMethodEnum } from '@audius/sdk'
import { useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { useToggle } from 'react-use'

import { useGetCurrentUserId, useGetTrackById } from '../../api'
import {
  ID,
  PaginatedStatus,
  Comment,
  ReplyComment,
  Status,
  UserTrackMetadata
} from '../../models'
import { tracksActions } from '../../store/pages/track/lineup/actions'
import { playerSelectors } from '../../store/player'
import { Nullable } from '../../utils'

import { useGetCommentsByTrackId } from './tanQueryClient'

type CommentSectionProviderProps = {
  entityId: ID
  entityType?: EntityType.TRACK

  // These are optional because they are only used on mobile
  // and provided for the components in CommentDrawer
  replyingToComment?: Comment | ReplyComment
  setReplyingToComment?: (comment: Comment | ReplyComment) => void
  editingComment?: Comment | ReplyComment
  setEditingComment?: (comment: Comment | ReplyComment) => void
}

type CommentSectionContextType = {
  currentUserId: Nullable<ID>
  artistId: ID
  isEntityOwner: boolean
  commentCount: number
  track: UserTrackMetadata
  playTrack: () => void
  commentSectionLoading: boolean
  commentIds: Comment[]
  currentSort: TrackCommentsSortMethodEnum
  isLoadingMorePages: boolean
  hasMorePages: boolean
  reset: (hard?: boolean) => void
  setCurrentSort: (sort: TrackCommentsSortMethodEnum) => void
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

  const [currentSort, setCurrentSort] = useState<TrackCommentsSortMethodEnum>(
    TrackCommentsSortMethodEnum.Top
  )

  const { data: currentUserId } = useGetCurrentUserId({})
  // TODO: fix types here
  const {
    data: commentIds = [],
    status,
    fetchNextPage,
    isFetchingNextPage: isLoadingMorePages
  } = useGetCommentsByTrackId({
    trackId: entityId,
    sortMethod: currentSort,
    userId: currentUserId
  })

  const loadMore = () => {
    console.log('LOADING MORE ')
    // !isLoadingMorePages && fetchNextPage()
  }
  const queryClient = useQueryClient()
  const reset = () => {
    // toggleRerender()
    queryClient.resetQueries({ queryKey: ['trackCommentList'] })
  }
  const hasMorePages = false
  const dispatch = useDispatch()
  const playerUid = useSelector(playerSelectors.getUid) ?? undefined
  const playTrack = useCallback(() => {
    dispatch(tracksActions.play(playerUid))
  }, [dispatch, playerUid])

  const commentSectionLoading = status === 'loading'

  const handleLoadMoreReplies = (commentId: string) => {
    console.log('Loading more replies for', commentId)
  }
  const handleMuteEntityNotifications = () => {
    console.log('Muting all notifs for ', entityId)
  }

  if (!track) {
    return null
  }

  const { owner_id, comment_count: commentCount } = track

  return (
    <CommentSectionContext.Provider
      value={{
        currentUserId,
        artistId: owner_id,
        entityId,
        entityType,
        commentCount,
        commentIds,
        commentSectionLoading,
        isEntityOwner: currentUserId === owner_id,
        isLoadingMorePages,
        track,
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
